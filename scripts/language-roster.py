#!/usr/bin/env python3
"""Write plans/100-languages-roster.json: the editions that take omarchy.org to 100 languages.

The roster keeps every existing edition and fills the remaining slots with the
most spoken missing languages. Ranking sources, in order of precedence:

  ethnologue-2026  Ethnologue 2026 total speakers (L1+L2), via Wikipedia's
                   "List of languages by total number of speakers" (languages
                   above 50 million), read 2026-09-12.
  ethnologue-2023  The same page's 2023 table (revision 1210841975), for
                   languages that table lists but the 2026 table no longer does.
  wikidata         Wikidata P1098 (number of speakers), queried 2026-09-12, for
                   the tail below Ethnologue's published cutoff. Wikidata mixes
                   vintages and L1/L2 definitions, so these ranks are indicative.

Selection rules (see plans/100-languages.md):
  - one edition per language; Chinese varieties and Arabic dialects fold into
    zh-CN and ar; Hindi-belt varieties other than Bhojpuri and Maithili fold
    into hi; macrolanguages without one written standard (Fula, Quechua) are
    skipped; Punjabi ships in Gurmukhi (pa), Pakistani readers already have ur.
  - a country domain is preferred when the language is that country's primary
    language and the domain is owned or obtainable; otherwise <code>.omarchy.org.
  - Node's Intl has no data for ny, ht, or gn, so those editions format dates
    and numbers with the country's other official language (en-MW, fr-HT,
    es-PY); the page language itself stays the edition's code.
  - every new edition starts at <code>.omarchy.org. The probe records which
    country domains look available; buying one and moving an edition to it is
    the documented handoff in docs/translations.md. A country domain that
    already serves Omarchy-flavoured content is not assumed to be ours.

Running the script also checks Node's Intl support for every format locale and
probes the preferred country domains (DNS, RDAP, HTTPS), recording the result
with a timestamp so the roster carries evidence rather than assumptions.
"""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import socket
import subprocess
import sys
from datetime import date
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'src/i18n/locales.json'
OUT = ROOT / 'plans/100-languages-roster.json'
UA = {'User-Agent': 'omarchy-site-roster/1.0 (+https://omarchy.org)'}

# code, English name, native name, script, direction, formatLocale, flag,
# preferred country domain (None when the language shares its country with an
# existing or larger edition), rank source, approximate total speakers in
# millions from that source.
NEW = [
    ('ru', 'Russian', 'Русский', 'Cyrillic', 'ltr', 'ru-RU', 'RU', 'omarchy.ru', 'ethnologue-2026', 210),
    ('id', 'Indonesian', 'Bahasa Indonesia', 'Latin', 'ltr', 'id-ID', 'ID', 'omarchy.id', 'ethnologue-2026', 255),
    ('de', 'German', 'Deutsch', 'Latin', 'ltr', 'de-DE', 'DE', 'omarchy.de', 'ethnologue-2026', 133),
    ('pcm', 'Nigerian Pidgin', 'Naijá', 'Latin', 'ltr', 'pcm-NG', 'NG', None, 'ethnologue-2026', 121),
    ('mr', 'Marathi', 'मराठी', 'Devanagari', 'ltr', 'mr-IN', 'IN', None, 'ethnologue-2026', 99),
    ('te', 'Telugu', 'తెలుగు', 'Telugu', 'ltr', 'te-IN', 'IN', None, 'ethnologue-2026', 96),
    ('sw', 'Swahili', 'Kiswahili', 'Latin', 'ltr', 'sw-TZ', 'TZ', 'omarchy.tz', 'ethnologue-2026', 95),
    ('ha', 'Hausa', 'Hausa', 'Latin', 'ltr', 'ha-NG', 'NG', None, 'ethnologue-2026', 94),
    ('pa', 'Punjabi', 'ਪੰਜਾਬੀ', 'Gurmukhi', 'ltr', 'pa-IN', 'IN', None, 'ethnologue-2026', 90),
    ('fa', 'Persian', 'فارسی', 'Arabic', 'rtl', 'fa-IR', 'IR', 'omarchy.ir', 'ethnologue-2026', 82),
    ('am', 'Amharic', 'አማርኛ', 'Ethiopic', 'ltr', 'am-ET', 'ET', 'omarchy.et', 'ethnologue-2026', 78),
    ('jv', 'Javanese', 'Basa Jawa', 'Latin', 'ltr', 'jv-ID', 'ID', None, 'ethnologue-2026', 69),
    ('gu', 'Gujarati', 'ગુજરાતી', 'Gujarati', 'ltr', 'gu-IN', 'IN', None, 'ethnologue-2026', 62),
    ('kn', 'Kannada', 'ಕನ್ನಡ', 'Kannada', 'ltr', 'kn-IN', 'IN', None, 'ethnologue-2026', 59),
    ('yo', 'Yoruba', 'Yorùbá', 'Latin', 'ltr', 'yo-NG', 'NG', None, 'ethnologue-2026', 53),
    ('bho', 'Bhojpuri', 'भोजपुरी', 'Devanagari', 'ltr', 'bho-IN', 'IN', None, 'ethnologue-2026', 53),
    ('ms', 'Malay', 'Bahasa Melayu', 'Latin', 'ltr', 'ms-MY', 'MY', 'omarchy.my', 'wikidata', 77),
    ('my', 'Burmese', 'မြန်မာ', 'Myanmar', 'ltr', 'my-MM', 'MM', 'omarchy.mm', 'ethnologue-2023', 43),
    ('ps', 'Pashto', 'پښتو', 'Arabic', 'rtl', 'ps-AF', 'AF', 'omarchy.af', 'wikidata', 39),
    ('or', 'Odia', 'ଓଡ଼ିଆ', 'Odia', 'ltr', 'or-IN', 'IN', None, 'ethnologue-2023', 40),
    ('ml', 'Malayalam', 'മലയാളം', 'Malayalam', 'ltr', 'ml-IN', 'IN', None, 'wikidata', 37),
    ('uk', 'Ukrainian', 'Українська', 'Cyrillic', 'ltr', 'uk-UA', 'UA', 'omarchy.ua', 'wikidata', 40),
    ('om', 'Oromo', 'Afaan Oromoo', 'Latin', 'ltr', 'om-ET', 'ET', None, 'wikidata', 37),
    ('sd', 'Sindhi', 'سنڌي', 'Arabic', 'rtl', 'sd-PK', 'PK', None, 'wikidata', 35),
    ('mai', 'Maithili', 'मैथिली', 'Devanagari', 'ltr', 'mai-IN', 'IN', None, 'wikidata', 34),
    ('su', 'Sundanese', 'Basa Sunda', 'Latin', 'ltr', 'su-ID', 'ID', None, 'wikidata', 32),
    ('ne', 'Nepali', 'नेपाली', 'Devanagari', 'ltr', 'ne-NP', 'NP', 'omarchy.np', 'wikidata', 32),
    ('ig', 'Igbo', 'Igbo', 'Latin', 'ltr', 'ig-NG', 'NG', None, 'wikidata', 31),
    ('ro', 'Romanian', 'Română', 'Latin', 'ltr', 'ro-RO', 'RO', 'omarchy.ro', 'wikidata', 28),
    ('zu', 'Zulu', 'isiZulu', 'Latin', 'ltr', 'zu-ZA', 'ZA', None, 'wikidata', 28),
    ('az', 'Azerbaijani', 'Azərbaycan dili', 'Latin', 'ltr', 'az-AZ', 'AZ', 'omarchy.az', 'wikidata', 24),
    ('as', 'Assamese', 'অসমীয়া', 'Bengali', 'ltr', 'as-IN', 'IN', None, 'wikidata', 24),
    ('so', 'Somali', 'Soomaali', 'Latin', 'ltr', 'so-SO', 'SO', 'omarchy.so', 'wikidata', 22),
    ('ceb', 'Cebuano', 'Binisaya', 'Latin', 'ltr', 'ceb-PH', 'PH', None, 'wikidata', 20),
    ('xh', 'Xhosa', 'isiXhosa', 'Latin', 'ltr', 'xh-ZA', 'ZA', None, 'wikidata', 20),
    ('ln', 'Lingala', 'Lingála', 'Latin', 'ltr', 'ln-CD', 'CD', 'omarchy.cd', 'wikidata', 20),
    ('km', 'Khmer', 'ខ្មែរ', 'Khmer', 'ltr', 'km-KH', 'KH', 'omarchy.kh', 'wikidata', 18),
    ('mg', 'Malagasy', 'Malagasy', 'Latin', 'ltr', 'mg-MG', 'MG', 'omarchy.mg', 'wikidata', 18),
    ('af', 'Afrikaans', 'Afrikaans', 'Latin', 'ltr', 'af-ZA', 'ZA', None, 'wikidata', 17),
    ('kk', 'Kazakh', 'Қазақ тілі', 'Cyrillic', 'ltr', 'kk-KZ', 'KZ', 'omarchy.kz', 'wikidata', 17),
    ('rw', 'Kinyarwanda', 'Ikinyarwanda', 'Latin', 'ltr', 'rw-RW', 'RW', 'omarchy.rw', 'wikidata', 15),
    ('ku', 'Kurdish', 'Kurdî', 'Latin', 'ltr', 'ku-TR', 'IQ', None, 'wikidata', 15),
    ('ny', 'Chichewa', 'Chichewa', 'Latin', 'ltr', 'en-MW', 'MW', 'omarchy.mw', 'wikidata', 14),
    ('bm', 'Bambara', 'Bamanankan', 'Latin', 'ltr', 'bm-ML', 'ML', 'omarchy.ml', 'wikidata', 14),
    ('cs', 'Czech', 'Čeština', 'Latin', 'ltr', 'cs-CZ', 'CZ', 'omarchy.cz', 'wikidata', 13),
    ('ht', 'Haitian Creole', 'Kreyòl ayisyen', 'Latin', 'ltr', 'fr-HT', 'HT', 'omarchy.ht', 'wikidata', 12),
    ('wo', 'Wolof', 'Wolof', 'Latin', 'ltr', 'wo-SN', 'SN', 'omarchy.sn', 'wikidata', 12),
    ('ak', 'Akan', 'Akan', 'Latin', 'ltr', 'ak-GH', 'GH', 'omarchy.gh', 'wikidata', 11),
    ('sn', 'Shona', 'chiShona', 'Latin', 'ltr', 'sn-ZW', 'ZW', None, 'wikidata', 11),
    ('lg', 'Luganda', 'Luganda', 'Latin', 'ltr', 'lg-UG', 'UG', 'omarchy.ug', 'wikidata', 11),
    ('rn', 'Kirundi', 'Ikirundi', 'Latin', 'ltr', 'rn-BI', 'BI', 'omarchy.bi', 'wikidata', 11),
    ('tk', 'Turkmen', 'Türkmen dili', 'Latin', 'ltr', 'tk-TM', 'TM', 'omarchy.tm', 'wikidata', 11),
    ('ug', 'Uyghur', 'ئۇيغۇرچە', 'Arabic', 'rtl', 'ug-CN', 'CN', None, 'wikidata', 10),
    ('tg', 'Tajik', 'Тоҷикӣ', 'Cyrillic', 'ltr', 'tg-TJ', 'TJ', 'omarchy.tj', 'wikidata', 10),
    ('sr', 'Serbian', 'Српски', 'Cyrillic', 'ltr', 'sr-RS', 'RS', 'omarchy.rs', 'wikidata', 10),
    ('he', 'Hebrew', 'עברית', 'Hebrew', 'rtl', 'he-IL', 'IL', 'omarchy.il', 'wikidata', 9),
    ('ti', 'Tigrinya', 'ትግርኛ', 'Ethiopic', 'ltr', 'ti-ER', 'ER', 'omarchy.er', 'wikidata', 9),
    ('bg', 'Bulgarian', 'Български', 'Cyrillic', 'ltr', 'bg-BG', 'BG', 'omarchy.bg', 'wikidata', 8),
    ('sk', 'Slovak', 'Slovenčina', 'Latin', 'ltr', 'sk-SK', 'SK', 'omarchy.sk', 'wikidata', 7),
    ('hy', 'Armenian', 'Հայերեն', 'Armenian', 'ltr', 'hy-AM', 'AM', 'omarchy.am', 'wikidata', 7),
    ('sq', 'Albanian', 'Shqip', 'Latin', 'ltr', 'sq-AL', 'AL', 'omarchy.al', 'wikidata', 7),
    ('hr', 'Croatian', 'Hrvatski', 'Latin', 'ltr', 'hr-HR', 'HR', 'omarchy.hr', 'wikidata', 7),
    ('lo', 'Lao', 'ລາວ', 'Lao', 'ltr', 'lo-LA', 'LA', 'omarchy.la', 'wikidata', 7),
    ('gn', 'Guarani', 'Avañeʼẽ', 'Latin', 'ltr', 'es-PY', 'PY', 'omarchy.py', 'wikidata', 6),
    ('mn', 'Mongolian', 'Монгол', 'Cyrillic', 'ltr', 'mn-MN', 'MN', 'omarchy.mn', 'wikidata', 6),
    ('ky', 'Kyrgyz', 'Кыргызча', 'Cyrillic', 'ltr', 'ky-KG', 'KG', 'omarchy.kg', 'wikidata', 5),
    ('be', 'Belarusian', 'Беларуская', 'Cyrillic', 'ltr', 'be-BY', 'BY', 'omarchy.by', 'wikidata', 5),
    ('ka', 'Georgian', 'ქართული', 'Georgian', 'ltr', 'ka-GE', 'GE', 'omarchy.ge', 'wikidata', 4),
    ('sl', 'Slovenian', 'Slovenščina', 'Latin', 'ltr', 'sl-SI', 'SI', 'omarchy.si', 'wikidata', 2.5),
]

SCRIPT_CODES = {'Latin': 'Latn', 'Cyrillic': 'Cyrl', 'Devanagari': 'Deva', 'Telugu': 'Telu', 'Gurmukhi': 'Guru',
                'Arabic': 'Arab', 'Ethiopic': 'Ethi', 'Gujarati': 'Gujr', 'Kannada': 'Knda', 'Myanmar': 'Mymr',
                'Odia': 'Orya', 'Malayalam': 'Mlym', 'Bengali': 'Beng', 'Khmer': 'Khmr', 'Hebrew': 'Hebr',
                'Armenian': 'Armn', 'Lao': 'Laoo', 'Georgian': 'Geor'}

# Languages that were considered and set aside, with the reason, so the next
# person does not re-litigate them from scratch.
SET_ASIDE = {
    'zh-TW': 'Traditional Chinese is a script and regional edition of zh-CN; strong candidate for a country edition later',
    'pt-BR': 'regional edition of pt; strongest candidate for a country edition (Brazil) once translations exist',
    'es-ES': 'regional edition of es-MX; country edition candidate',
    'yue/wuu/nan/hak/cjy/hsn/gan': 'Chinese varieties without a separate written standard used online; covered by zh-CN',
    'arz/apc/apd/ary/arq/aec/acm': 'Arabic dialects; the written web uses Modern Standard Arabic, covered by ar',
    'awa/mag/hne/bgc/mwr/raj': 'Hindi-belt varieties written in Devanagari and read through hi; Bhojpuri and Maithili kept for size and official status',
    'pnb': 'Western Punjabi in Shahmukhi; Pakistani readers have ur, Gurmukhi pa chosen as the Punjabi edition',
    'ff': 'Fula macrolanguage without one written standard',
    'qu': 'Quechua macrolanguage without one written standard',
    'lv/et/mt/bs/mk/ilo/hil/min/mad/st/tn/nso/ki/ee': 'next candidates below the cut; country editions may pull some forward',
}


def intl_check(locales):
    script = '''
    const out = {};
    for (const tag of process.argv.slice(1)) {
      try {
        const d = new Intl.DateTimeFormat(tag, { dateStyle: 'long' });
        const n = new Intl.NumberFormat(tag);
        out[tag] = { date: d.format(new Date(Date.UTC(2026, 8, 12))), number: n.format(1234567.89),
                     resolved: d.resolvedOptions().locale, supported: Intl.DateTimeFormat.supportedLocalesOf([tag]).length === 1 };
      } catch (e) { out[tag] = { error: String(e) }; }
    }
    console.log(JSON.stringify(out));
    '''
    result = subprocess.run(['node', '-e', script, *locales], capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


NOT_FOUND = ('no entries found', 'not found', 'no match', 'no data found', 'is available', 'status: free',
             'no object found', 'not registered', 'does not exist', 'nothing found', 'available for registration')
FOUND = ('domain status', 'registrar:', 'registrant', 'nserver', 'name server', 'created:', 'creation date',
         'registered on', 'status: ok', 'status: active', 'domain name:')


def whois(domain):
    """Registered / unregistered / unknown from the registry WHOIS, for TLDs without RDAP."""
    try:
        text = subprocess.run(['whois', domain], capture_output=True, text=True, timeout=25).stdout.lower()
    except Exception:
        return 'unknown'
    if any(phrase in text for phrase in NOT_FOUND):
        return 'unregistered'
    if any(phrase in text for phrase in FOUND):
        return 'registered'
    return 'unknown'


def probe(domain):
    record = {'domain': domain}
    try:
        record['ip'] = socket.gethostbyname(domain)
    except OSError:
        record['ip'] = None
    try:
        with urllib.request.urlopen(urllib.request.Request(f'https://rdap.org/domain/{domain}', headers=UA), timeout=20) as r:
            body = json.load(r)
        record['rdap'] = 'registered'
        for entity in body.get('entities', []):
            if 'registrar' in entity.get('roles', []):
                for field in entity.get('vcardArray', [None, []])[1]:
                    if field[0] == 'fn':
                        record['registrar'] = field[3]
    except urllib.error.HTTPError as exc:
        record['rdap'] = 'unregistered' if exc.code == 404 else f'http {exc.code}'
    except Exception as exc:  # timeouts, TLDs without RDAP
        record['rdap'] = f'unknown ({type(exc).__name__})'
    if record['rdap'].startswith(('unknown', 'http')):
        record['whois'] = whois(domain)
    if record['ip']:
        try:
            r = subprocess.run(['curl', '-sS', '-o', '/dev/null', '-w', '%{http_code} %{redirect_url}', '--max-time', '12',
                                '-I', f'https://{domain}'], capture_output=True, text=True, timeout=20)
            code, _, redirect = r.stdout.partition(' ')
            record['https'] = code
            if redirect:
                record['redirect'] = redirect
            page = subprocess.run(['curl', '-sSL', '--max-time', '12', f'https://{domain}'], capture_output=True, text=True, timeout=25).stdout
            record['serves_omarchy'] = 'omarchy' in page.lower()
        except Exception as exc:
            record['https'] = f'error ({type(exc).__name__})'
    registered = record.get('rdap') == 'registered' or record.get('whois') == 'registered'
    unregistered = record.get('rdap') == 'unregistered' or record.get('whois') == 'unregistered'
    if record.get('serves_omarchy') and registered:
        record['verdict'] = 'taken-serves-omarchy-content'
    elif unregistered and not record['ip']:
        record['verdict'] = 'available'
    elif record['ip'] or registered:
        record['verdict'] = 'taken'
    else:
        record['verdict'] = 'unknown'
    return record


def main():
    registry = json.loads(REGISTRY.read_text())
    existing = [code for code, entry in registry.items() if entry.get('contentLocale', code) == code]
    codes = [row[0] for row in NEW]
    assert len(codes) == len(set(codes)), 'duplicate code in roster'
    assert not set(codes) & set(registry), f'already registered: {set(codes) & set(registry)}'
    total = len(existing) + len(NEW)
    assert total == 100, f'{len(existing)} existing + {len(NEW)} new = {total}, not 100'

    intl = intl_check([row[5] for row in NEW])
    with ThreadPoolExecutor(max_workers=16) as pool:
        probes = {p['domain']: p for p in pool.map(probe, [row[7] for row in NEW if row[7]])}

    editions = []
    for code, english, native, script, direction, fmt, flag, country_domain, source, millions in NEW:
        probe_result = probes.get(country_domain) if country_domain else None
        editions.append({
            'code': code, 'englishName': english, 'nativeName': native, 'script': SCRIPT_CODES[script],
            'scriptName': script, 'direction': direction,
            'formatLocale': fmt, 'ogLocale': fmt.replace('-', '_'), 'flag': flag,
            # Always the subdomain for now: a country domain that answers with Omarchy content may be a
            # community or squatter site, and attaching one needs a zone in our Cloudflare account anyway.
            'domain': f'https://{code}.omarchy.org',
            'preferredCountryDomain': country_domain, 'countryDomainStatus': probe_result,
            'rank': {'source': source, 'totalSpeakersMillions': millions}, 'intl': intl[fmt],
        })

    OUT.write_text(json.dumps({
        'generated': date.today().isoformat(),
        'target': 100,
        'existing': existing,
        'new': editions,
        'setAside': SET_ASIDE,
        'sources': {
            'ethnologue-2026': 'https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers (Ethnologue 2026 table, read 2026-09-12)',
            'ethnologue-2023': 'https://en.wikipedia.org/w/index.php?oldid=1210841975',
            'wikidata': 'https://query.wikidata.org/ P1098 number of speakers, queried 2026-09-12',
        },
    }, ensure_ascii=False, indent=1) + '\n')
    print(f'{len(existing)} existing + {len(NEW)} new = {total}')
    for e in editions:
        i = e['intl']
        flag = '' if i.get('supported') and i.get('resolved', '').lower() == e['formatLocale'].lower() else f"  INTL resolved={i.get('resolved')} supported={i.get('supported')}"
        status = e['countryDomainStatus']
        dom = f"{e['preferredCountryDomain']}: {status['verdict']}" if status else '-'
        print(f"{e['code']:4} {e['englishName']:16} {e['direction']} {e['formatLocale']:7} {dom:36} {i.get('date','')}{flag}")


if __name__ == '__main__':
    sys.exit(main())
