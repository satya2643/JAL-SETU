# Vizag JalAlert Firestore Security Specification

## 1. Data Invariants
1. **Public Ward Telemetry & Notifications**: Citizens can view real-time valve statuses, water release schedules, and municipal announcements across all 98 GVMC divisions.
2. **Administrative SCADA Protection**: Only verified administrators can publish, modify, or delete civic broadcasts, or override ward gate valve statuses.
3. **Citizen Identity & PII Isolation**: Residents can only read and write their own resident profile (`/residents/{residentId}`). They cannot modify roles, spoof other citizen profiles, or inject unauthorized fields.
4. **Emergency Tanker Bookings**: Citizens can create emergency tanker bookings for their own ward address. Once created, only administrators and operators can update dispatch status (`dispatched`, `delivered`).
5. **No Blanket Reads/Writes**: Catch-all default deny on all other paths.

## 2. Dirty Dozen Malicious Payloads
1. **Ghost Field in Resident Profile**: Injecting `role: "admin"` into a resident profile write. (REJECTED by strict schema / hasOnly check)
2. **Identity Spoofing in Resident Profile**: Creating a resident document with `residentId` differing from authenticated `request.auth.uid`. (REJECTED)
3. **Public Reading Other Residents' PII**: Unauthenticated or unauthorized user reading another citizen's contact details. (REJECTED)
4. **Unauthorized Notification Publish**: Regular resident attempting to create a `/notifications` document. (REJECTED)
5. **Unauthorized Ward Status Override**: Citizen attempting to force a valve status to `Supplying Now`. (REJECTED)
6. **Immortal Field Tampering**: Updating `createdAt` or `residentId` on existing records. (REJECTED)
7. **Junk ID Resource Exhaustion**: Attempting to create document with 2KB string ID containing special injection characters. (REJECTED by `isValidId()`)
8. **Negative Pressure Injection**: Setting `pressureBar` to -50.0 in ward telemetry. (REJECTED)
9. **Fake Tanker Dispatch Cancellation**: Normal user updating an existing tanker booking to mark status as `delivered` without authorization. (REJECTED)
10. **Unauthenticated Tanker Booking**: Anonymous user writing tanker booking with invalid phone number format. (REJECTED)
11. **Mass List Query Scraping**: Malicious user running unbounded `residents` collection query. (REJECTED by list rule enforcement)
12. **Tampering with Terminal State**: Attempting to alter a `delivered` tanker booking. (REJECTED)
