import type { BloodRequest } from "./types";
import { COMPATIBLE_DONORS, componentLabel, formatDateTime } from "./blood";

/**
 * Shareable SOS text for a blood request — the message a family would
 * otherwise type by hand into WhatsApp forwards. Kept plain-text and
 * compact so it survives copy/paste across WhatsApp, SMS, and groups.
 */
export function buildSosText(
  request: BloodRequest,
  pledgedUnits: number = 0
): string {
  const head =
    request.urgency === "critical"
      ? "URGENT — Blood needed"
      : request.urgency === "urgent"
        ? "Blood needed"
        : "Blood donation request";
  const stillNeeded = Math.max(0, request.units - pledgedUnits);
  const donorGroups = COMPATIBLE_DONORS[request.group].join(", ");
  const lines = [
    `BLOOD — ${head}`,
    `${request.units} unit${request.units > 1 ? "s" : ""} of ${request.group} ${componentLabel(request.component)} for ${request.patientName}`,
    `${request.hospital} (${request.area})`,
    pledgedUnits > 0
      ? `Still need ${stillNeeded} unit${stillNeeded === 1 ? "" : "s"} (${pledgedUnits} pledged)`
      : `Need ${stillNeeded} unit${stillNeeded === 1 ? "" : "s"}`,
    `Eligible donor groups: ${donorGroups}`,
    `Contact: ${request.contactName} — ${request.contactPhone}`,
    `Valid till: ${formatDateTime(request.expiresAt)}`,
    "Please forward to donors who can help.",
  ];
  return lines.join("\n");
}

/** Short phone script for families calling matched donors one by one. */export function buildCallScript(request: BloodRequest): string {
  return [
    `Hi, I'm calling from the Raktha blood network on behalf of ${request.contactName}.`,
    `A patient at ${request.hospital} needs ${request.units} unit${
      request.units > 1 ? "s" : ""
    } of ${request.group} ${componentLabel(request.component)}${request.urgency === "critical" ? " urgently" : ""}.`,
    "Are you able to donate? You can come straight to the hospital blood bank counter.",
    `Questions? Call ${request.contactName} on ${request.contactPhone}.`,
  ].join(" ");
}

export function whatsappHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * First message to a donor from the directory — many donors answer a
 * WhatsApp text faster than an unknown-number call, and it doubles as a
 * written record of what was asked.
 */
export function buildDonorContactText(donorName: string, group: string): string {
  return [
    `Hi ${donorName}, this is a message from the Raktha blood donor network.`,
    `Are you available to donate blood (${group}) for a patient nearby?`,
    "If yes, just reply here and we'll share the hospital details. Thank you!",
  ].join("\n");
}

export function smsHref(text: string): string {
  return `sms:?body=${encodeURIComponent(text)}`;
}

/**
 * Donor-recruitment message. Researched: blood services grow their regular
 * repeat-donor base through referrals — one personal invite from a donor
 * converts better than any poster.
 */
export function buildInviteText(name: string, group: string): string {
  const who = name.trim()
    ? `${name.trim()}${group ? ` (${group})` : ""}`
    : group
      ? `A ${group} blood donor`
      : "A blood donor";
  return [
    `${who} invites you to join Raktha — a local blood donor network.`,
    "Register in a minute, check your eligibility in two, and get called only when someone near you truly needs your blood group.",
    "One donation can help up to three patients.",
  ].join("\n");
}
