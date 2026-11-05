---
title: Namespace joins as a Distinguished Corporate Patron
date: 2026-10-09 12:00 +0200
author: DHH
author_url: https://dhh.dk
description: Namespace joins the Omacom Foundation as a Distinguished Corporate Patron with $100,000 a year in compute, which we're dedicating to ARM development and builds.
---

I'm delighted to welcome [Namespace](https://namespace.so/) to the [Omacom Foundation](/foundation/) as a [Distinguished Corporate Patron](/patrons/#distinguished-corporate-patrons), contributing **$100,000 a year in compute for three years** that we're plowing straight into ARM builds and QA.

Omarchy grew up on x86. That's where most of our users are today, and that's what all our testing was built around. But ARM is coming fast. [Omarchy M](/news/2026/09/introducing-omarchy-m/) is bringing Omarchy to Apple Silicon, [Omarchy Dragon](/news/2026/09/introducing-omarchy-dragon/) is doing the same for Snapdragon laptops, Alibaba's [Qwen Book](/news/2026/09/alibaba-cloud-joins-as-founding-corporate-patron/) is launching on ARM first, and there's a whole crop of ARM laptops on the way that deserve better than whatever they'll ship with.

If Omarchy is going to be great on all of these new machines, every change has to work on ARM before it ships. Compiling isn't enough. We have to actually install the thing and watch it boot.

And that's where it gets annoying. You can rent plenty of ARM machines in the cloud, and they'll compile ARM software all day long. But most of them won't let you run a virtual machine, and you can't test an installer without one. So you're stuck emulating the whole processor in software. Booting our ARM ISO that way took over three minutes. Three minutes! Just to boot!

Namespace has a much better answer: They [run Linux on Apple Silicon](https://x.com/namespacelabs/status/2091895197151952950). On their runners, that same ISO boots in four seconds. Four! That's the kind of speed a distro backed by [an actual rocket company](/news/2026/10/spacexai-joins-as-founding-corporate-patron/) needs to hit.

Namespace already runs the builds for [Zed](https://zed.dev/) and [DuckDB](https://duckdb.org/), and for [mise](https://mise.jdx.dev/), which the foundation [also sponsors](/news/2026/08/omacom-foundation-to-be-premier-mise-sponsor/). Great company to be in!

[Namespace joins 1Password, 37signals, Four Technologies, Fireworks, OpenAI, OpenRouter, and OrcaRouter as a Distinguished Corporate Patron](/patrons/#distinguished-corporate-patrons). Their pledge brings our [total backing to approximately **$23.5 million**](/news/2026/08/omacom-foundation-launches-with-8-million/).

Thank you, Hugo and everyone at Namespace! And to [Emir](/staff/), our new Head of Infrastructure, for making the connection. Let's make Omarchy run beautifully on every ARM machine out there.

If your company would like to [join our patrons](/patrons/), write [david@omarchy.org](mailto:david@omarchy.org).
