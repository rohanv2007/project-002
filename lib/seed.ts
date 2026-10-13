import type { BloodBank, BloodGroup, BloodRequest, CampEvent, Donor, Team } from "./types";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const daysAgo = (d: number) => {
  const dt = new Date(now - d * 86400_000);
  return dt.toISOString().slice(0, 10);
};
const daysAhead = (d: number) => {
  const dt = new Date(now + d * 86400_000);
  return dt.toISOString().slice(0, 10);
};

export function seedDonors(): Donor[] {
  const rows: Array<Omit<Donor, "id" | "createdAt">> = [
    { name: "Arun Kumar", group: "O+", phone: "+91 98400 11223", area: "Thandalam", available: true, lastDonation: daysAgo(120), donations: 6 },
    { name: "Divya Shree", group: "B+", phone: "+91 98410 22334", area: "Sriperumbudur", available: true, lastDonation: daysAgo(200), donations: 3 },
    { name: "Karthik Raja", group: "A+", phone: "+91 98420 33445", area: "Poonamallee", available: true, lastDonation: null, donations: 0 },
    { name: "Meera Nair", group: "O-", phone: "+91 98430 44556", area: "Kanchipuram", available: true, lastDonation: daysAgo(150), donations: 8 },
    { name: "Suresh Babu", group: "AB+", phone: "+91 98440 55667", area: "Thandalam", available: false, lastDonation: daysAgo(30), donations: 4 },
    { name: "Priya Dharshini", group: "B-", phone: "+91 98450 66778", area: "Sriperumbudur", available: true, lastDonation: daysAgo(400), donations: 2 },
    { name: "Vignesh S", group: "A-", phone: "+91 98460 77889", area: "Poonamallee", available: true, lastDonation: null, donations: 1 },
    { name: "Lakshmi Menon", group: "O+", phone: "+91 98470 88990", area: "Kanchipuram", available: true, lastDonation: daysAgo(95), donations: 5 },
    { name: "Ravi Chandran", group: "AB-", phone: "+91 98480 99001", area: "Thandalam", available: true, lastDonation: daysAgo(300), donations: 7 },
    { name: "Anitha R", group: "B+", phone: "+91 98490 10112", area: "Poonamallee", available: true, lastDonation: daysAgo(60), donations: 2 },
    { name: "Mohammed Asif", group: "O+", phone: "+91 98500 21223", area: "Sriperumbudur", available: false, lastDonation: daysAgo(10), donations: 9 },
    { name: "Deepa V", group: "A+", phone: "+91 98510 32334", area: "Thandalam", available: true, lastDonation: daysAgo(500), donations: 4 },
  ];
  return rows.map((r, i) => ({
    ...r,
    id: `seed_donor_${i + 1}`,
    createdAt: hoursAgo(24 * (i + 2)),
  }));
}

export function seedRequests(): BloodRequest[] {
  return [
    {
      id: "seed_req_1",
      patientName: "R. Selvam",
      group: "B-",
      units: 2,
      hospital: "Govt. Hospital, Sriperumbudur",
      area: "Sriperumbudur",
      contactName: "Kavitha (daughter)",
      contactPhone: "+91 98600 11122",
      urgency: "critical",
      notes: "Surgery scheduled early morning. B- is rare — please share widely.",
      status: "open",
      createdAt: hoursAgo(3),
      expiresAt: new Date(now + 20 * 3600_000).toISOString(),
    },
    {
      id: "seed_req_2",
      patientName: "A. Fathima",
      group: "O+",
      units: 1,
      hospital: "Saveetha Medical College",
      area: "Thandalam",
      contactName: "Imran (husband)",
      contactPhone: "+91 98610 22233",
      urgency: "urgent",
      notes: "Post-delivery transfusion. Donor can come directly to the blood bank counter.",
      status: "open",
      createdAt: hoursAgo(9),
      expiresAt: new Date(now + 14 * 3600_000).toISOString(),
    },
    {
      id: "seed_req_3",
      patientName: "M. Gopal",
      group: "AB+",
      units: 3,
      hospital: "MIOT International",
      area: "Poonamallee",
      contactName: "Ward 4B nurse station",
      contactPhone: "+91 98620 33344",
      urgency: "scheduled",
      notes: "Planned transfusion for Thursday. Flexible on timing.",
      status: "open",
      createdAt: hoursAgo(26),
      expiresAt: new Date(now + 48 * 3600_000).toISOString(),
    },
  ];
}

const stock = (o: Partial<Record<BloodGroup, number>>): Record<BloodGroup, number> => ({
  "O-": 0, "O+": 0, "A-": 0, "A+": 0, "B-": 0, "B+": 0, "AB-": 0, "AB+": 0,
  ...o,
});

export function seedBanks(): BloodBank[] {
  return [
    {
      id: "seed_bank_1",
      name: "Govt. Blood Bank, Sriperumbudur",
      area: "Sriperumbudur",
      phone: "+91 44 2715 2200",
      hours: "Mon–Sat, 9 AM – 5 PM",
      stock: stock({ "O+": 14, "A+": 9, "B+": 11, "AB+": 4, "O-": 2 }),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "seed_bank_2",
      name: "Saveetha Blood Centre",
      area: "Thandalam",
      phone: "+91 44 2681 0150",
      hours: "All days, 8 AM – 8 PM",
      stock: stock({ "O+": 22, "O-": 3, "A+": 12, "A-": 2, "B+": 8, "B-": 1, "AB+": 5 }),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "seed_bank_3",
      name: "Indian Red Cross Blood Bank",
      area: "Poonamallee",
      phone: "+91 44 2627 3344",
      hours: "Mon–Fri, 9 AM – 6 PM",
      stock: stock({ "O+": 10, "A+": 6, "B+": 7, "AB+": 2, "AB-": 1 }),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function seedTeams(): Team[] {
  return [
    {
      id: "seed_team_1",
      name: "REC Blood Warriors",
      description: "CSE students keeping a steady donor circle on campus — first call for any local emergency.",
      memberIds: ["seed_donor_1", "seed_donor_4", "seed_donor_5", "seed_donor_9"],
      createdAt: hoursAgo(24 * 90),
    },
    {
      id: "seed_team_2",
      name: "Thandalam Lifesavers",
      description: "Neighbourhood group around Thandalam — rare-group donors welcome.",
      memberIds: ["seed_donor_2", "seed_donor_6", "seed_donor_8"],
      createdAt: hoursAgo(24 * 45),
    },
  ];
}

export function seedCamps(): CampEvent[] {
  const rows: Array<Omit<CampEvent, "id" | "createdAt">> = [
    {
      name: "REC Mega Blood Drive",
      organiser: "REC NSS Cell",
      venue: "Main Auditorium, Rajalakshmi Engineering College",
      area: "Thandalam",
      date: daysAhead(9),
      startTime: "9:00 AM",
      endTime: "2:00 PM",
      contactPhone: "+91 98400 55443",
    },
    {
      name: "Sriperumbudur Community Camp",
      organiser: "Lions Club, Sriperumbudur",
      venue: "Govt. Higher Secondary School Ground",
      area: "Sriperumbudur",
      date: daysAhead(23),
      startTime: "10:00 AM",
      endTime: "1:00 PM",
      contactPhone: "+91 98410 66554",
    },
  ];
  return rows.map((r, i) => ({
    ...r,
    id: `seed_camp_${i + 1}`,
    createdAt: hoursAgo(24 * (i + 1)),
  }));
}
