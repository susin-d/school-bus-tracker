# Safety and Compliance

## Non-Negotiable Rules

- Driver phone number must never be exposed to parents
- Student records are visible only to authorized guardians and school staff
- All critical alerts must be immutable after creation
- GPS tracking is active only during a valid trip lifecycle
- Every admin override requires actor, timestamp, and reason

## Operational Safeguards

- Stale location warnings after configurable threshold
- Driver assignment verification before trip start
- Attendance anomaly detection:
  - drop-off without boarding
  - duplicate boarding
  - student marked absent but boarded
- SOS alerts must fan out to admins immediately

## Privacy Requirements

- Encrypt all API traffic with TLS
- Store least-privilege user data only
- Gate student photos behind signed URLs or protected media endpoints
- Retain audit events according to school policy and local regulation

## India-Focused Data Considerations

- Record parental consent for student transportation tracking
- Support subject access and deletion workflows where legally applicable
- Keep vendor list minimal and documented

## Logging and Audit

High-risk actions that must be audited:

- trip start and end
- manual attendance override
- route reassignment
- alert acknowledgement and resolution
- admin force-close of trip
- user suspension
