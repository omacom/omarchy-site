---
title: Introducing Omarchy M
date: 2026-09-11 14:00 +0200
author: DHH
author_url: https://dhh.dk
description: Fourteen people are making Omarchy run on Apple Silicon, from a native Mac installer to GPU drivers, MLX, and Touch ID. Meet the team, try it today, and get in touch if you've been working on the same problem.
---

Apple makes great hardware. They always have (minus that one time with the butterfly keyboard). And a lot of the people arriving at Omarchy are arriving from a Mac. Many of them would love to keep the machine and lose the operating system. So we're going to finish what Asahi started: Omarchy running beautifully on Apple Silicon, with a minimum of setup fuss.

That work already has a team behind it. Today we're making it official: [Omarchy M](/teams/#m), our team for Macs with Apple Silicon (plus a few members keeping older Macs in the fold).

Allow me to introduce the members.

**The installer.** [Marcelo Alcantara](https://x.com/maralcbr) is building the [native Mac installer](https://github.com/maralcbr/omarchy-mx-mac). You download an app on macOS, it fetches the signed Omarchy release, carves out the partitions, and boots you into Omarchy alongside your existing macOS. No USB stick, no incantations in the terminal. He also cut the build that lit up external monitors over USB-C.

**Omarchy Mac.** [Naeem Malik](https://x.com/tiredkebab) has maintained [Omarchy Mac](https://github.com/omacom/omarchy-mac) for a year, getting Omarchy onto M1 and M2 machines long before any of this was official, and building a Discord community of over 800 people around it. [Scott Jones](https://x.com/bi9kahuna) is the other half of that project on the Linux side of the install. He recently got the M3 Air's display running on Apple's hardware display controller, which took that machine from unusable to usable in a night.

**Try Omarchy.** [Eduardo Martinez](https://x.com/martiano) built [Try Omarchy](https://github.com/omacom/try-omarchy): the real Omarchy desktop running as a native, hardware-accelerated app on your Mac, with your camera, audio, clipboard, and a shared folder wired through. Nothing to partition. Just download it and see what the fuss is about.

**Packages.** [Shun Li](https://x.com/riverleaf88) is making sure everything Omarchy needs exists as an [aarch64 package](https://github.com/riverscn/omarchy-pkgs-aarch64), along with generic ARM64 disk images for virtual machines and the guest tools that make them pleasant to use.

**Drivers and the kernel.** [Dj](https://x.com/buildwithdjdev) is writing the GPU drivers, and got Touch ID working by talking directly to the Secure Enclave. [Miguel Cruz](https://x.com/acelogic_) reverse-engineered Apple's proprietary N1 chip in the M5 machines and now has its Wi-Fi and Bluetooth fully functional in Linux. [Liam](https://x.com/LiamRay1O) is bringing up speakers, trackpad, and power management on the newest machines. [Eryk Wieliczko](https://x.com/ewninjaofficial) runs [Aurora Silicon](https://aurorasilicon.org/) and is turning all of this into clean-room implementations that can go upstream. [Jaidip Subedi](https://x.com/jaidipsubedi) enabled [external displays over USB-C on the M2 MacBook Air](https://github.com/subedijaidip/dp-altmode-t8112).

**MLX.** [Joshua Warren](https://x.com/JoshuaSWarren) is building [mlx-omarchy](https://github.com/joshuaswarren/mlx-omarchy), which brings Apple's MLX machine learning framework to Linux on Apple GPUs through Vulkan. Your code still says `import mlx.core as mx`, but now it runs on Omarchy.

**Older Macs.** [Shawn Yeager](https://x.com/shawnyeager) has a stack of pull requests for the 2016 and 2017 Touch Bar MacBook Pros: speakers, Wi-Fi, the ambient light sensor, the Touch Bar itself. [Randy](https://x.com/novuon_ai) is reverse-engineering the T2 security chip to bring Touch ID to Intel Macs, and documenting every fix for the 2019 MacBook Pro along the way. [Jon Kinney](https://x.com/jondkinney) was chipping away at ARM support for Omarchy a year ago, and now keeps the whole team coordinated on who's doing what.

Together, they're a formidable group. Fourteen people who didn't wait for permission, and who've been using agents to move at a pace that would have seemed absurd a year ago.

The target for the first release is perfect compatibility with M1 and M2, including the Pro and Max variants:

- A seamless installer, with both install and try options
- Full GPU support
- External monitors over USB-C
- Touch ID
- MLX
- Disk encryption

Newer machines are being worked on in parallel, but M1 and M2 are where we plant the flag first. In addition to the M machines, there are millions of vintage laptops out there, many of them already retired from Apple's latest macOS ambitions, and every one of them is a wonderful Omarchy computer waiting to happen.

You don't have to wait for the polished release to get started. [Try Omarchy](https://github.com/omacom/try-omarchy) will have you looking at the real desktop on your Mac in minutes. And if you're ready to commit, [the installer](https://github.com/maralcbr/omarchy-mx-mac) will put Omarchy next to macOS on an M1 or M2 today.

Finally, a request. If you've been working on Linux for Apple hardware, whether that's kernel drivers, firmware, packaging, installers, or machine learning, we'd love to hear from you. There's a good chance you've solved something we're still chasing, or vice versa. Get in touch at [apple@omarchy.org](mailto:apple@omarchy.org).

Let's finish what Asahi started.
