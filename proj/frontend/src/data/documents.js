// Mock documents per candidate. Keyed by candidateId.
export const requiredDocumentTypes = [
  "Aadhaar Card",
  "PAN Card",
  "Resume",
  "Degree Certificate",
  "Bank Details",
  "Passport Photo",
];

export const documentsByCandidate = {
  "EMP-CAN-001": [
    { id: "DOC-101", type: "Aadhaar Card", submittedDate: "2026-09-20", status: "Verified", verifiedBy: "Anjali Menon" },
    { id: "DOC-102", type: "PAN Card", submittedDate: "2026-09-20", status: "Verified", verifiedBy: "Anjali Menon" },
    { id: "DOC-103", type: "Resume", submittedDate: "2026-09-19", status: "Verified", verifiedBy: "Anjali Menon" },
    { id: "DOC-104", type: "Degree Certificate", submittedDate: "2026-09-21", status: "Submitted", verifiedBy: null },
    { id: "DOC-105", type: "Bank Details", submittedDate: "2026-09-21", status: "Rejected", verifiedBy: "Anjali Menon", rejectionReason: "Document image is unclear. Please upload a clearer copy." },
    { id: "DOC-106", type: "Passport Photo", submittedDate: null, status: "Pending", verifiedBy: null },
  ],
  "EMP-CAN-002": [
    { id: "DOC-201", type: "Aadhaar Card", submittedDate: "2026-09-12", status: "Verified", verifiedBy: "Karan Mehta" },
    { id: "DOC-202", type: "PAN Card", submittedDate: "2026-09-12", status: "Verified", verifiedBy: "Karan Mehta" },
    { id: "DOC-203", type: "Resume", submittedDate: "2026-09-11", status: "Verified", verifiedBy: "Karan Mehta" },
    { id: "DOC-204", type: "Degree Certificate", submittedDate: "2026-09-13", status: "Verified", verifiedBy: "Karan Mehta" },
    { id: "DOC-205", type: "Bank Details", submittedDate: "2026-09-13", status: "Verified", verifiedBy: "Karan Mehta" },
    { id: "DOC-206", type: "Passport Photo", submittedDate: "2026-09-13", status: "Verified", verifiedBy: "Karan Mehta" },
  ],
  "EMP-CAN-004": [
    { id: "DOC-401", type: "Aadhaar Card", submittedDate: "2026-09-24", status: "Submitted", verifiedBy: null },
    { id: "DOC-402", type: "PAN Card", submittedDate: "2026-09-24", status: "Submitted", verifiedBy: null },
    { id: "DOC-403", type: "Resume", submittedDate: "2026-09-23", status: "Verified", verifiedBy: "Karan Mehta" },
    { id: "DOC-404", type: "Degree Certificate", submittedDate: null, status: "Pending", verifiedBy: null },
    { id: "DOC-405", type: "Bank Details", submittedDate: null, status: "Pending", verifiedBy: null },
    { id: "DOC-406", type: "Passport Photo", submittedDate: null, status: "Pending", verifiedBy: null },
  ],
};

export function getDocumentsForCandidate(candidateId) {
  return (
    documentsByCandidate[candidateId] ||
    requiredDocumentTypes.map((type, i) => ({
      id: `DOC-${candidateId}-${i}`,
      type,
      submittedDate: null,
      status: "Pending",
      verifiedBy: null,
    }))
  );
}
