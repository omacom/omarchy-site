---
title: Introducing Omarchy Dragon
date: 2026-09-18 08:00 +0200
author: DHH
author_url: https://dhh.dk
description: Meet the five people bringing Omarchy to Snapdragon laptops, from installation and recovery to battery life, sleep, drivers, and upstream Linux fixes.
---

We should have teams responsible for every major platform, and Qualcomm's Snapdragon certainly deserves one! Last week, we introduced [Omarchy M](/news/2026/09/introducing-omarchy-m/) for Apple hardware. Today, we're making [Omarchy Dragon](/teams/#dragon) official: our team working to make Omarchy run beautifully on Snapdragon computers.

The goal is to turn these thin-and-light laptops into dependable everyday Linux machines. Getting a desktop to boot is a start. Getting the machine to sleep, wake up, play video efficiently, update its firmware, and last through a day of work is what makes it a computer you can rely on.

Five people are already working on the pieces:

**Jim Martin** ([GitHub](https://github.com/jdvmi00)) is bringing up Linux on a Surface Laptop 8 with the Snapdragon X2 Elite. He's been working on Omarchy for DGX Spark and has already contributed a graphical disk-unlock fix to the ARM installer. For Dragon, he's focused on Surface and X2 Elite support, testing installation and recovery on real hardware, and getting useful ARM fixes into the shared Omarchy projects.

**Birk Skyum** ([X](https://x.com/BirkSkyum)) is a geoinformatics and graphics engineer and co-founder of MapLibre. His machine is a Lenovo Yoga Slim 7x with Snapdragon X Elite. He's landed upstream fixes in Arch Linux ARM, submitted patches to libcamera, PipeWire, and systemd, and worked on kernel patches for fan and temperature monitoring. Now he's looking at battery life, reliable sleep, KVM virtualization, hardware-accelerated video, BIOS updates from Linux, and USB4 performance. He's also in touch with Lenovo about improving firmware support for Linux.

**Matt Gilg** ([GitHub](https://github.com/gilgm12)) has already gotten a working Omarchy desktop, Hyprland and all, onto a Snapdragon X Yoga and DGX Spark. He built and hosted the aarch64 packages to get there before moving to the Omarchy Package Repository. Matt runs SignalRGB and brings experience with cross-vendor hardware compatibility, embedded systems, and low-level Linux work. He's also bringing up an OmniBook X16 with Snapdragon X2 Elite, with a particular interest in gaming and helping more people find a route out of Windows.

**Bob Prendergast** ([GitHub](https://github.com/bprendie)) is a solution architect and Linux veteran who's built his own [Omarchy Snapdragon setup](https://github.com/bprendie/omarchy-snapdragon) using agents and the Ubuntu kernel. He's working with an HP EliteBook 14 G1q and a Lenovo ThinkPad T14s Gen 6. More machines, more testing, and more of the practical work it takes to turn a promising platform into something people can install and use.

**Miguel Cruz** ([X](https://x.com/acelogic_)) is already part of Omarchy M and is bringing his experience with Apple Silicon boot and hardware compatibility to the Qualcomm side. His background spans OS internals, reverse engineering, and embedded systems, with contributions to Linux, QEMU, and Virtio. He's joining the effort with an ASUS Zenbook A16 powered by Snapdragon X2 Elite Extreme, focusing on boot and firmware bring-up, driver issues (especially the GPU), and testing fixes on real hardware.

There's useful overlap with the rest of our ARM work, too. Packages, installer improvements, and fixes developed for one machine can help another. Jim and Matt are both interested in extending that work to Raspberry Pi and other ARM platforms as well.

I'm also working to establish a direct line to Qualcomm. An engineer working on Linux compatibility there has already reached out. Let's see if we can't get some proper support behind this effort.

This is work in progress, with compatibility being worked through machine by machine. But we now have a team taking responsibility for it, testing on real hardware, and pushing fixes upstream. Welcome, Jim, Birk, Matt, Bob, and Miguel. Let's bring beautiful, fun & agentic Linux to Snapdragon!
