# Product Scope

## Product Goal

SURAKSHA helps parents track buses safely, helps drivers run trips without unsafe communication patterns, and gives school admins operational visibility across routes, buses, students, and incidents.

## Primary Users

### Parent

- Track a child's assigned bus in real time during active trips
- Receive alerts for boarding, arrival, delay, and drop-off
- Submit leave requests before a trip
- Review attendance and trip history
- Contact school administration through approved channels

### Driver

- Start and end an assigned trip
- View route stops and assigned student manifest
- Mark boarding and drop-off events
- Report delays, incidents, or emergencies
- Receive operational instructions from admins

### School Admin

- Manage buses, routes, stops, drivers, students, and assignments
- Monitor active trips and alerts
- Review attendance and operational reports
- Handle safety incidents and escalation workflows

## Product Principles

- Child safety overrides convenience
- Parents never communicate directly with drivers
- GPS tracking only runs when a trip is active
- Every high-risk event is logged and auditable
- UI must be clear under stress and poor network conditions

## Scope By Phase

### Phase 1: MVP

- Role-based authentication
- Parent live map for active bus
- Driver trip start and trip end
- Student boarding and drop-off logging
- Admin route and assignment management
- Push notifications for key trip events

### Phase 2: Operational Maturity

- Geofence-based arrival alerts
- Leave management
- Driver-admin chat
- Delay reporting
- Attendance reports and admin dashboard analytics

### Phase 3: Premium and AI

- SOS escalation flows
- Route deviation alerts
- Speed anomaly alerts
- Capacity monitoring
- Face recognition attendance
- Multi-language support

## Non-Goals For MVP

- Parent-driver direct chat or voice calls
- General-purpose messaging between all user roles
- Support for ad SDKs
- Open-ended route editing by drivers during a trip
