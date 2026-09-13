---
title: Omarchy at work
seoTitle: 'Omarchy at work: A guide for employers and IT'
description: What employers and IT administrators need to know before approving Omarchy, including endpoint management compatibility, security defaults, and a pilot checklist.
---

Want to use Omarchy on a work computer? This page is for the manager approving the request and the IT team responsible for the machine.

Omarchy combines Arch Linux with a desktop built around Hyprland. It can be a good fit for development and browser-based work. Approval still depends on your company's applications, security tools, and support requirements.

## What managers need to know

- **Start with your required tools.** Some vendors explicitly support Omarchy or Arch; others support only specific Linux distributions. A working installation is not the same as a supported one.
- **Keep the company's controls.** Disk encryption, access restrictions, backups, and an agreed update schedule still need owners. Switching operating systems does not remove those responsibilities.
- **Approve a pilot before a rollout.** Have IT verify the employee's actual workflow and required security controls on one machine, with a way back to the approved setup if the pilot fails.

If your policy requires vendor-supported Microsoft Intune enrollment, Omarchy is outside Microsoft's published Linux enrollment requirements. Settle that requirement before replacing Windows.

## Endpoint management compatibility

This table summarizes vendor documentation, checked **13 September 2026**, for a standard x86-64 Omarchy desktop. It is not a record of agent installation tests. Recheck the linked requirements for the version you plan to deploy.

"Listed" means the vendor names Omarchy or Arch. "Not listed" means its published platform list does not include either; it does not prove an agent cannot run. "Confirm scope" means the public documentation does not establish support for this configuration.

| Product and published support                                                                                                                              | What IT needs to know                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Fleet](https://fleetdm.com/docs/get-started/faq#what-host-operating-systems-does-fleet-support)<br>Listed, with feature limits                            | Fleet explicitly lists Omarchy and Arch hosts. Its Desktop UI support lists GNOME and KDE, not Hyprland. Encryption enforcement is limited to Ubuntu, Kubuntu, and Fedora. Confirm the specific controls you need.                                |
| [Microsoft Intune](https://learn.microsoft.com/en-us/intune/user-help/enrollment/enroll-linux)<br>Not listed                                               | Enrollment requires specified Ubuntu Desktop or RHEL releases and GNOME. Omarchy with Hyprland is outside that documented configuration.                                                                                                          |
| [Microsoft Defender for Endpoint](https://learn.microsoft.com/en-us/defender-endpoint/mde-linux-prerequisites#supported-linux-distributions)<br>Not listed | Microsoft excludes distributions absent from its support list. Linux agent availability does not establish supported protection on Omarchy.                                                                                                       |
| [CrowdStrike Falcon](https://www.crowdstrike.com/en-us/products/faq/)<br>Not listed                                                                        | The public Linux support list names specific distributions and sensor versions, not Arch or Omarchy. Ask CrowdStrike about your exact distribution, kernel, and sensor before treating it as supported.                                           |
| [JumpCloud](https://jumpcloud.com/support/agent-compatibility-system-requirements-and-impacts)<br>Not listed                                               | Neither Arch nor Omarchy appears in the agent's supported distributions. JumpCloud also cautions against non-default desktop environments.                                                                                                        |
| [1Password Device Trust](https://support.1password.com/device-trust-the-kolide-agent/#supported-platforms)<br>Confirm scope                                | Kolide's published Linux testing covers Ubuntu LTS and RHEL, with GNOME and KDE on X11 and Wayland. These notes do not establish Omarchy/Hyprland support. Confirm required checks and browser integration; password-manager support is separate. |

Management, threat detection, and access decisions are different jobs. An agent reporting inventory does not establish that remote wipe, disk recovery, malware protection, or sign-in restrictions work. Ask the vendor to confirm each required capability, then verify it in your company environment.

## Security and policy questions

### Encryption and boot policy

The [installer defaults to LUKS disk encryption](/manual/getting-started/), but an unencrypted installation is possible. Verify the actual machine and agree who holds recovery access before storing company data. Local encryption does not by itself provide centralized recovery-key storage or compliance reporting.

The installation guide currently instructs users to disable Secure Boot. If your company requires Secure Boot or TPM-based device attestation, resolve that requirement with IT before changing firmware settings. Disk encryption and proof of a trusted boot are separate controls.

### Administrator access and installed software

Omarchy provides local administration through `sudo` and lets users install packages, shell plugins, and development tools. It also offers a [temporary passwordless sudo mode](/manual/security/). Decide who may administer a work machine, which software sources are allowed, and how exceptions are reviewed. Include AI tools and their access to company data in that decision.

The firewall is enabled with a deny-incoming policy and [rules for LocalSend and DNS to the Docker bridge](https://github.com/omacom/omarchy/blob/v4.0.3/install/config/firewall.sh). [SSH access is opt-in](/manual/security/). Review file sharing, remote access, and any services the employee enables against your network policy.

### Updates and support

Omarchy uses rolling packages rather than a fixed long-term-support release. New installs use the stable channel, which combines Omarchy releases with a delayed Arch mirror. The [update guide](/manual/updates/) explains the channels and the supported update flow.

Agree who applies updates, how soon security fixes must be installed, when restarts happen, and how agent compatibility is checked after kernel updates. A stable channel is not a contractual patch deadline. Assign an internal support owner and an escalation plan for a machine that cannot reach company services.

### Backups and offboarding

[System snapshots](/manual/system-snapshots/) can recover a broken system update, but do not restore the user's home directory. Company files need a separate backup with a tested restore process.

The [factory reset flow](/manual/security/) prepares a machine for another owner and requires the installer's baseline snapshot. It is separate from remote wipe and [does not guarantee secure erasure](https://github.com/omacom/omarchy/blob/v4.0.3/bin/omarchy-system-factory-reset#L22-L27), even on encrypted drives. IT still needs a plan for a lost or offline device, account and token revocation, data retention, and approved disposal.

### Sign-in, applications, and peripherals

Test the actual company sign-in flow, including multi-factor authentication and policies that require a compliant device. Being able to open a website or connect to a VPN is not proof that device-based access controls are satisfied.

Check the applications the employee relies on: document editing, meetings and screen sharing, VPN, certificates, smart cards, printers, and docks. Where a Windows application is essential, test an approved browser or remote-desktop alternative. A Windows VM does not establish management or protection of the Linux host.

## A small pilot with a clear decision

Record the outcome somewhere both the employee and IT can find:

1. **Scope:** the employee, hardware, Omarchy version and channel, workload, and data allowed on the pilot machine.
2. **Required controls:** the management and security products, agent versions, vendor support evidence, and any explicitly approved exceptions.
3. **Evidence:** confirm the machine appears in the admin console, required checks report correctly, prohibited access is blocked, and backups restore. Repeat the checks after an update and restart.
4. **Ownership:** name the people responsible for updates, recovery access, incidents, and employee departure.
5. **Exit:** set a review date and a tested way to return to the approved environment if a required control or application fails.

An employee's successful setup is useful evidence for a pilot. Company approval comes from verifying the controls and workflow that matter to that company.

## Keep this guide current

Vendor support changes. [Suggest a correction](https://github.com/omacom/omarchy-site/edit/master/content/workplace.md) with the product, distribution, desktop environment, relevant versions, and a link to the vendor's documentation. Label hands-on results separately from vendor support.
