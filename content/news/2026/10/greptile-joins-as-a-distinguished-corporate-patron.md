---
title: Greptile joins as a Distinguished Corporate Patron
date: 2026-10-15 12:00 +0200
author: DHH
author_url: https://dhh.dk
description: Greptile joins the Omacom Foundation as a Distinguished Corporate Patron with $150,000 in tokens for their PR review service, which has already reviewed almost 1,500 Omarchy pull requests.
---

I'm thrilled to welcome [Greptile](https://www.greptile.com/) to the [Omacom Foundation](/foundation/) as a [Distinguished Corporate Patron](/patrons/#distinguished-corporate-patrons)! They're contributing **$150,000 in tokens for their PR review service**, so every pull request coming into Omarchy can keep getting a careful second pair of eyes.

And it's not like we're starting from scratch. Greptile has already reviewed **almost 1,500 pull requests** for Omarchy. Nearly all of them since the launch of Quattro in August, and almost 700 in the first half of October alone! That's the kind of volume you get when [hundreds of thousands of users](/news/2026/09/quattro-crosses-200000-iso-downloads/) start sending in their fixes, and no team of human reviewers could keep up with that on their own.

But volume doesn't mean much if the reviews are just noise. What makes Greptile great is how often it finds real issues. Across our 60 most recently merged PRs that it reviewed, Greptile flagged 39 problems it rated as serious. And not lint-style nitpicks either, but the kind of bugs that would have bitten real users.

Like when [Birk](https://github.com/birkskyum) added a way to match laptop models by their device tree, and Greptile pointed out that under a Turkish locale, Bash lowercases `I` to a dotless `ı`, so `MICROSOFT,Denali-OLED` would never match `microsoft,denali-oled`. Who would have caught that?! [It was fixed before merging](https://github.com/omacom/omarchy/pull/15064). Or when I wrote a command to reset empty workspaces to a new default layout, and Greptile noticed that if `hyprctl` ever returned garbage, my script would happily delete every saved layout, including the ones in use. [Fixed too](https://github.com/omacom/omarchy/pull/15266)! Nobody gets a pass, least of all me.

This is what agentic peer review should feel like. A reviewer who reads every line of every PR, at any hour, explains exactly what will go wrong and why, and often hands you the patch to fix it. It doesn't replace the judgment of the [Omarchy teams](/teams/), but it means that by the time a human looks at a PR, the sharp edges have usually already been filed down. That's how we get through a backlog of thousands of PRs without letting quality slip.

[Greptile joins 1Password, 37signals, Four Technologies, Fireworks, OpenAI, OpenRouter, OrcaRouter, and Namespace as a Distinguished Corporate Patron](/patrons/#distinguished-corporate-patrons). Their pledge brings our [total backing to approximately **$23.7 million**](/news/2026/08/omacom-foundation-launches-with-8-million/). We're grateful for their patronage.

Welcome aboard, Greptile! Let's keep reviewing every PR like it matters, because it does.

If your company would like to [join our patrons](/patrons/), write [david@omarchy.org](mailto:david@omarchy.org).
