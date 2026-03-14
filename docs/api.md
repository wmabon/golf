# API Reference

## Authentication

- All endpoints except `POST /api/auth/register` and `/api/auth/[...nextauth]` require authentication.
- Auth is handled via **Auth.js JWT session cookie** (automatically set on login).
- Admin endpoints (`/api/admin/*`) require the `admin` or `concierge_ops` role (`requireConcierge`).
- Quality-score admin endpoints require the `admin` role (`requireAdmin`).
- Users can only modify their own profile/memberships (`requireSelf`).

## Error Format

All error responses follow a consistent shape:

```json
{ "error": "Human-readable error message" }
```

Common status codes: `400` validation error, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict.

---

## 1. Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Create a new account |
| * | `/api/auth/[...nextauth]` | None | Auth.js sign-in, sign-out, session |

### POST /api/auth/register

**Request:**

```json
{
  "name": "Jordan Smith",
  "email": "jordan@example.com",
  "password": "securePass123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| name | string | required, 1-255 chars |
| email | string | required, valid email |
| password | string | required, 8-128 chars |

**Response `201`:**

```json
{
  "user": {
    "id": "uuid",
    "name": "Jordan Smith",
    "email": "jordan@example.com"
  }
}
```

---

## 2. Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/:userId` | Authenticated | Get user profile |
| PUT | `/api/users/:userId` | Self only | Update own profile |
| GET | `/api/users/:userId/memberships` | Self only | List club memberships |
| POST | `/api/users/:userId/memberships` | Self only | Add a club membership |

### PUT /api/users/:userId

**Request (all fields optional):**

```json
{
  "name": "Jordan Smith",
  "phone": "+15551234567",
  "handicap": 12.4,
  "homeAirport": "ATL",
  "preferredLocation": "Southeast US"
}
```

| Field | Type | Rules |
|-------|------|-------|
| name | string? | 1-255 chars |
| phone | string? | max 20 chars, nullable |
| handicap | number? | -10 to 54, nullable |
| homeAirport | string? | max 10 chars, nullable |
| preferredLocation | string? | max 255 chars, nullable |

### POST /api/users/:userId/memberships

**Request:**

```json
{
  "clubName": "Augusta National",
  "networkName": "Invited",
  "accessType": "member",
  "willingToSponsor": true,
  "guestLimitNotes": "2 guests per visit",
  "notes": "Available most weekdays"
}
```

| Field | Type | Rules |
|-------|------|-------|
| clubName | string | required, 1-255 chars |
| networkName | string? | max 255 chars, nullable |
| accessType | string | required, 1-50 chars |
| willingToSponsor | boolean? | default `false` |
| guestLimitNotes | string? | nullable |
| notes | string? | nullable |

**Response `201`:**

```json
{ "membership": { "id": "uuid", "clubName": "Augusta National", "..." : "..." } }
```

---

## 3. Trips

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips` | Authenticated | List current user's trips |
| POST | `/api/trips` | Authenticated | Create a new trip |
| GET | `/api/trips/:tripId` | Trip member | Get trip detail |
| PUT | `/api/trips/:tripId` | Trip member | Update trip |
| GET | `/api/trips/:tripId/invites` | Trip member | List invitations |
| POST | `/api/trips/:tripId/invites` | Trip member | Send invitations |

### POST /api/trips

**Request:**

```json
{
  "name": "Pinehurst Weekend",
  "dateStart": "2026-05-15",
  "dateEnd": "2026-05-18",
  "golferCount": 4,
  "anchorType": "airport_code",
  "anchorValue": "RDU",
  "budgetSettings": {
    "perRoundMin": 75,
    "perRoundMax": 250
  }
}
```

| Field | Type | Rules |
|-------|------|-------|
| name | string | required, 1-255 chars |
| dateStart | string | required, `YYYY-MM-DD` |
| dateEnd | string | required, `YYYY-MM-DD` |
| golferCount | number? | 2-8, default `4` |
| anchorType | enum | `airport_code` \| `city_region` \| `map_area` |
| anchorValue | string | required, 1-255 chars |
| budgetSettings | object? | `{ perRoundMin?: number, perRoundMax?: number }` |

**Response `201`:**

```json
{ "trip": { "id": "uuid", "name": "Pinehurst Weekend", "status": "draft", "..." : "..." } }
```

### PUT /api/trips/:tripId

Same fields as create, all optional (partial update).

### POST /api/trips/:tripId/invites

**Request:**

```json
{ "emails": ["alice@example.com", "bob@example.com"] }
```

**Response `201`:**

```json
{
  "results": [
    { "email": "alice@example.com", "status": "sent" },
    { "email": "bob@example.com", "status": "already_member" }
  ]
}
```

---

## 4. Options & Voting

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/options` | Trip member | List shortlist options |
| POST | `/api/trips/:tripId/options` | Trip member | Add option to shortlist |
| GET | `/api/trips/:tripId/options/:optionId/votes` | Trip member | List votes for option |
| POST | `/api/trips/:tripId/options/:optionId/votes` | Trip member | Cast or update vote |
| POST | `/api/trips/:tripId/options/:optionId/override` | Captain only | Captain override pick |

### POST /api/trips/:tripId/options

**Request:**

```json
{
  "type": "course",
  "title": "Pinehurst No. 2",
  "estimatedCostPerGolfer": 350,
  "fitScore": 4.2,
  "fitRationale": "Great match for group skill level and budget"
}
```

| Field | Type | Rules |
|-------|------|-------|
| type | enum | `destination` \| `course` \| `itinerary` |
| title | string | required, 1-500 chars |
| estimatedCostPerGolfer | number? | >= 0 |
| fitScore | number? | 0-5 |
| fitRationale | string? | max 2000 chars |

**Response `201`:**

```json
{ "option": { "id": "uuid", "type": "course", "title": "Pinehurst No. 2", "..." : "..." } }
```

### POST /api/trips/:tripId/options/:optionId/votes

**Request:**

```json
{
  "voteValue": "in",
  "comment": "Absolutely, let's do it",
  "budgetObjection": false
}
```

| Field | Type | Rules |
|-------|------|-------|
| voteValue | enum | `in` \| `fine` \| `out` |
| comment | string? | max 1000 chars, nullable |
| budgetObjection | boolean? | default `false` |

**Response `201`:**

```json
{ "vote": { "id": "uuid", "optionId": "uuid", "userId": "uuid", "voteValue": "in" } }
```

### POST /api/trips/:tripId/options/:optionId/override

Captain override -- no request body required. Returns the selected option and vote summary.

**Response `200`:**

```json
{
  "option": { "id": "uuid", "status": "selected", "..." : "..." },
  "voteSummary": { "in": 3, "fine": 1, "out": 0 }
}
```

---

## 5. Course Search

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/search/courses` | Authenticated | Search courses by location |
| GET | `/api/search/resolve-location?query=` | Authenticated | Resolve city/place to lat/lng |
| GET | `/api/search/suggestions?q=&limit=` | Authenticated | Autocomplete airport/location |

### POST /api/search/courses

**Request:**

```json
{
  "anchor": { "type": "airport", "value": "RDU" },
  "radiusMiles": 50,
  "priceBand": { "min": 50, "max": 200 },
  "accessTypes": ["public", "resort"],
  "includePrivate": false,
  "sortBy": "distance",
  "page": 1,
  "pageSize": 20
}
```

The `anchor` field is a discriminated union on `type`:

| anchor.type | anchor.value | Description |
|-------------|-------------|-------------|
| `airport` | string (e.g. `"RDU"`) | IATA airport code |
| `city` | string (e.g. `"Scottsdale, AZ"`) | City or region name |
| `coordinates` | `{ lat: number, lng: number }` | Exact lat/lng point |
| `bounds` | `{ sw: {lat, lng}, ne: {lat, lng} }` | Map bounding box |

| Field | Type | Rules |
|-------|------|-------|
| anchor | object | required, see above |
| radiusMiles | number? | 1-200, default `50` (ignored for bounds) |
| priceBand | object? | `{ min?: number, max?: number }` |
| accessTypes | string[]? | `public`, `resort`, `semi_private`, `private` |
| includePrivate | boolean? | default `false` |
| tripId | uuid? | scope results for a specific trip |
| sortBy | enum? | `distance` \| `price` \| `quality`, default `distance` |
| page | number? | >= 1, default `1` |
| pageSize | number? | 1-100, default `20` |

### GET /api/search/resolve-location

**Query params:** `query` (required) -- a city or place name.

**Response `200`:**

```json
{ "location": { "lat": 35.227, "lng": -80.843, "name": "Charlotte, NC" } }
```

### GET /api/search/suggestions

**Query params:** `q` (required), `limit` (optional, 1-50, default 10).

**Response `200`:**

```json
{
  "suggestions": [
    { "code": "RDU", "name": "Raleigh-Durham International", "city": "Raleigh" }
  ]
}
```

---

## 6. Courses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/courses/:courseId` | Authenticated | Get course detail |
| GET | `/api/courses/:courseId/reviews?page=&pageSize=` | Authenticated | List reviews (paginated) |
| POST | `/api/courses/:courseId/reviews` | Authenticated | Submit a review |
| GET | `/api/courses/:courseId/quality` | Authenticated | Get quality breakdown |
| POST | `/api/courses/:courseId/report` | Authenticated | Report a data issue |

### POST /api/courses/:courseId/reviews

**Request:**

```json
{
  "conditioning": 4,
  "layout": 5,
  "value": 3,
  "pace": 4,
  "service": 5,
  "vibe": 4,
  "text": "Incredible course, pace was a bit slow on the back nine.",
  "roundId": "uuid-or-null"
}
```

| Field | Type | Rules |
|-------|------|-------|
| conditioning | integer | required, 1-5 |
| layout | integer | required, 1-5 |
| value | integer | required, 1-5 |
| pace | integer | required, 1-5 |
| service | integer | required, 1-5 |
| vibe | integer | required, 1-5 |
| text | string? | max 5000 chars, nullable |
| roundId | uuid? | nullable, links review to a played round |

**Response `201`:**

```json
{ "review": { "id": "uuid", "courseId": "uuid", "conditioning": 4, "..." : "..." } }
```

### POST /api/courses/:courseId/report

**Request:**

```json
{
  "reportType": "wrong_price",
  "description": "Listed at $50 but actually charges $120 for non-residents."
}
```

| Field | Type | Rules |
|-------|------|-------|
| reportType | enum | `misclassified_access` \| `wrong_price` \| `closed_permanently` \| `duplicate` \| `other` |
| description | string | required, 10-2000 chars |

---

## 7. Booking

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/booking-requests` | Trip member | List booking requests |
| POST | `/api/trips/:tripId/booking-requests` | Trip member | Create booking request |
| GET | `/api/trips/:tripId/booking-room` | Trip member | Get booking room state |
| GET | `/api/trips/:tripId/reservations` | Trip member | List confirmed reservations |
| GET | `/api/trips/:tripId/external-bookings` | Trip member | List external bookings |
| POST | `/api/trips/:tripId/external-bookings` | Trip member | Capture an external booking |

### POST /api/trips/:tripId/booking-requests

**Request:**

```json
{
  "courseId": "uuid",
  "targetDate": "2026-05-16",
  "targetTimeRange": { "earliest": "07:00", "latest": "10:00" },
  "preferredTime": "08:30",
  "numGolfers": 4,
  "notes": "Cart included please"
}
```

| Field | Type | Rules |
|-------|------|-------|
| courseId | uuid | required |
| targetDate | string | required, `YYYY-MM-DD` |
| targetTimeRange | object | required, `{ earliest: string, latest: string }` |
| preferredTime | string? | preferred tee time |
| numGolfers | integer | required, 2-8 |
| notes | string? | max 2000 chars |

### POST /api/trips/:tripId/external-bookings

**Request:**

```json
{
  "type": "golf",
  "source": "GolfNow",
  "confirmationNumber": "GN-123456",
  "date": "2026-05-16",
  "time": "08:30",
  "cost": 280,
  "bookingContact": "John at pro shop",
  "notes": "Includes cart and range balls",
  "linkUrl": "https://golfnow.com/conf/123456"
}
```

| Field | Type | Rules |
|-------|------|-------|
| type | enum | `golf` \| `lodging` \| `flight` \| `other` |
| source | string? | max 255 chars |
| confirmationNumber | string? | max 255 chars |
| date | string | required, `YYYY-MM-DD` |
| time | string? | max 10 chars |
| cost | number? | >= 0 |
| bookingContact | string? | max 255 chars |
| notes | string? | max 2000 chars |
| linkUrl | string? | valid URL, max 500 chars |

---

## 8. Billing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/billing/fee-estimate` | Authenticated | Preview fee breakdown before booking |
| GET | `/api/trips/:tripId/fees` | Trip member | List fees charged to this trip |

### POST /api/billing/fee-estimate

**Request:**

```json
{
  "type": "tee_time_service",
  "baseCost": 200,
  "numGolfers": 4
}
```

| Field | Type | Rules |
|-------|------|-------|
| type | enum | `tee_time_service` \| `cancellation_penalty` \| `pass_through` |
| baseCost | number | required, >= 0 |
| numGolfers | integer? | 1-8 |

**Response `200`:**

```json
{
  "serviceFee": 20,
  "passThrough": 200,
  "total": 220,
  "lineItems": [
    { "label": "Tee time service fee", "amount": 20 },
    { "label": "Green fees (pass-through)", "amount": 200 }
  ]
}
```

---

## 9. Admin

All admin endpoints require the `concierge_ops` or `admin` role.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/booking-requests?status=&assignedTo=` | Concierge | List pending booking requests |
| GET | `/api/admin/booking-requests/:requestId` | Concierge | Get booking request detail |
| GET | `/api/admin/booking-requests/escalated` | Concierge | List escalated requests |
| PUT | `/api/admin/booking-requests/:requestId/assign` | Concierge | Assign request to agent |
| PUT | `/api/admin/booking-requests/:requestId/status` | Concierge | Update request status |
| POST | `/api/admin/booking-requests/:requestId/notes` | Concierge | Add internal note |
| POST | `/api/admin/booking-requests/:requestId/confirmation` | Concierge | Attach tee-time confirmation |
| PUT | `/api/admin/courses/:courseId/quality-scores` | Admin | Update editorial quality scores |

### PUT /api/admin/booking-requests/:requestId/assign

**Request:**

```json
{ "assignedTo": "uuid-of-agent" }
```

### PUT /api/admin/booking-requests/:requestId/status

**Request:**

```json
{ "status": "booked" }
```

| Status values | |
|---------------|--|
| `candidate` | Initial state |
| `window_pending` | Booking window not yet open |
| `requested` | Request placed with course |
| `partial_hold` | Some slots held |
| `booked` | Fully confirmed |
| `canceled` | Canceled |

### POST /api/admin/booking-requests/:requestId/notes

**Request:**

```json
{ "note": "Called pro shop, they'll hold 8:30am for 48 hours." }
```

### POST /api/admin/booking-requests/:requestId/confirmation

**Request:**

```json
{
  "slots": [
    {
      "slotId": "uuid",
      "confirmationNumber": "PS-2026-7890",
      "confirmedTeeTime": "2026-05-16T08:30:00Z",
      "costPerPlayer": 70,
      "totalCost": 280
    }
  ]
}
```

| Field | Type | Rules |
|-------|------|-------|
| slots | array | required, min 1 item |
| slots[].slotId | uuid | required |
| slots[].confirmationNumber | string | required, 1-255 chars |
| slots[].confirmedTeeTime | string | required, ISO 8601 datetime |
| slots[].costPerPlayer | number? | >= 0 |
| slots[].totalCost | number? | >= 0 |

**Response `200`:**

```json
{
  "request": { "id": "uuid", "status": "booked", "..." : "..." },
  "reservations": [
    { "id": "uuid", "confirmationNumber": "PS-2026-7890", "..." : "..." }
  ]
}
```

### PUT /api/admin/courses/:courseId/quality-scores

**Request:**

```json
{
  "editorialScore": 4.5,
  "externalRankScore": 3.8,
  "valueScore": 4.0,
  "valueLabel": "Great Value",
  "tripFitInputs": { "walkability": 3, "difficulty": 4 }
}
```

| Field | Type | Rules |
|-------|------|-------|
| editorialScore | number? | 0-5 |
| externalRankScore | number? | 0-5 |
| valueScore | number? | 0-5 |
| valueLabel | string? | max 100 chars, nullable |
| tripFitInputs | Record<string, number>? | nullable |

---

## 10. Optimization

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/swap-suggestions` | Trip member | List swap suggestions |
| GET | `/api/trips/:tripId/swap-suggestions/:suggestionId` | Trip member | Get swap suggestion detail |
| POST | `/api/trips/:tripId/swap-suggestions/:suggestionId/approve` | Captain only | Approve a swap suggestion |
| POST | `/api/trips/:tripId/swap-suggestions/:suggestionId/decline` | Captain only | Decline a swap suggestion |
| GET | `/api/trips/:tripId/swap-policy` | Trip member | Get swap policy |
| PUT | `/api/trips/:tripId/swap-policy` | Captain only | Update swap policy |
| GET | `/api/trips/:tripId/rebooking-timeline` | Trip member | Get rebooking timeline |
| GET | `/api/trips/:tripId/freeze-date` | Trip member | Get freeze date |
| PUT | `/api/trips/:tripId/freeze-date` | Captain only | Update freeze date |

### POST /api/trips/:tripId/swap-suggestions/:suggestionId/approve

Captain-only. No request body required. Returns the updated suggestion.

**Response `200`:**

```json
{ "suggestion": { "id": "uuid", "status": "approved", "..." : "..." } }
```

### POST /api/trips/:tripId/swap-suggestions/:suggestionId/decline

Captain-only. Optional decline reason.

**Request:**

```json
{ "reason": "We prefer the original course" }
```

| Field | Type | Rules |
|-------|------|-------|
| reason | string? | max 1000 chars |

**Response `200`:**

```json
{ "suggestion": { "id": "uuid", "status": "declined", "..." : "..." } }
```

### PUT /api/trips/:tripId/swap-policy

Captain-only. Sets the trip's swap-suggestion handling policy.

**Request:**

```json
{ "policy": "captain_approval" }
```

| Field | Type | Rules |
|-------|------|-------|
| policy | enum | `notify_only` \| `captain_approval` \| `auto_upgrade` |

**Response `200`:**

```json
{ "policy": "captain_approval" }
```

### PUT /api/trips/:tripId/freeze-date

Captain-only. Sets the date after which no more swaps are allowed.

**Request:**

```json
{ "freezeDate": "2026-05-10" }
```

| Field | Type | Rules |
|-------|------|-------|
| freezeDate | string | required, `YYYY-MM-DD` |

**Response `200`:**

```json
{ "freezeDate": "2026-05-10" }
```

---

## 11. Itinerary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/itinerary` | Trip member | Get canonical itinerary |
| POST | `/api/trips/:tripId/itinerary/items` | Trip member | Create manual itinerary item |
| PUT | `/api/trips/:tripId/itinerary/items/:itemId` | Trip member | Update itinerary item |
| DELETE | `/api/trips/:tripId/itinerary/items/:itemId` | Trip member | Delete itinerary item |

### GET /api/trips/:tripId/itinerary

Returns the canonical day-by-day itinerary for the trip, assembled from confirmed bookings and manually added items.

**Response `200`:**

```json
{
  "itinerary": {
    "tripId": "uuid",
    "days": [
      {
        "date": "2026-05-15",
        "items": [
          {
            "id": "uuid",
            "itemType": "flight",
            "title": "Arrive RDU",
            "date": "2026-05-15",
            "startTime": "2026-05-15T14:30:00Z",
            "sortOrder": 0
          },
          {
            "id": "uuid",
            "itemType": "lodging",
            "title": "Check in - Pinehurst Resort",
            "date": "2026-05-15",
            "startTime": "2026-05-15T16:00:00Z",
            "confirmationNumber": "PH-99887",
            "sortOrder": 1
          }
        ]
      },
      {
        "date": "2026-05-16",
        "items": [
          {
            "id": "uuid",
            "itemType": "golf",
            "title": "Pinehurst No. 2",
            "date": "2026-05-16",
            "startTime": "2026-05-16T08:30:00Z",
            "cost": 350,
            "sortOrder": 0
          }
        ]
      }
    ]
  }
}
```

### POST /api/trips/:tripId/itinerary/items

**Request:**

```json
{
  "itemType": "dining",
  "title": "Group dinner at 195 American",
  "date": "2026-05-16",
  "startTime": "2026-05-16T19:00:00Z",
  "endTime": "2026-05-16T21:00:00Z",
  "location": { "address": "195 Main St, Pinehurst, NC" },
  "confirmationNumber": "RES-4455",
  "bookingContact": "Host desk",
  "participants": ["uuid-1", "uuid-2"],
  "contactNotes": "Ask for the patio",
  "cost": 60,
  "notes": "Prix fixe menu, BYOB",
  "sortOrder": 2
}
```

| Field | Type | Rules |
|-------|------|-------|
| itemType | enum | `golf` \| `lodging` \| `flight` \| `dining` \| `transport` \| `note` \| `other` |
| title | string | required, 1-500 chars |
| date | string | required, `YYYY-MM-DD` |
| startTime | string? | ISO 8601 datetime |
| endTime | string? | ISO 8601 datetime |
| location | object? | `{ address?: string, lat?: number, lng?: number }` |
| confirmationNumber | string? | max 255 chars |
| bookingContact | string? | max 255 chars |
| participants | uuid[]? | array of user IDs |
| contactNotes | string? | max 2000 chars |
| cost | number? | >= 0 |
| notes | string? | max 5000 chars |
| sortOrder | integer? | display order within the day |

**Response `201`:**

```json
{ "item": { "id": "uuid", "itemType": "dining", "title": "Group dinner at 195 American", "..." : "..." } }
```

---

## 12. Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/:userId/notifications?page=&pageSize=` | Self only | List notifications (paginated) |
| PUT | `/api/users/:userId/notifications/read-all` | Self only | Mark all notifications as read |
| GET | `/api/users/:userId/notifications/unread-count` | Self only | Get unread notification count |
| PUT | `/api/users/:userId/notifications/:notificationId/read` | Self only | Mark single notification as read |
| GET | `/api/users/:userId/notification-preferences` | Self only | Get notification preferences |
| PUT | `/api/users/:userId/notification-preferences` | Self only | Update notification preferences |

### PUT /api/users/:userId/notification-preferences

**Request:**

```json
[
  { "eventType": "invite", "channel": "email", "enabled": true },
  { "eventType": "invite", "channel": "in_app", "enabled": true },
  { "eventType": "swap_suggestion", "channel": "sms", "enabled": false },
  { "eventType": "booking_confirmation", "channel": "email", "enabled": true }
]
```

Each element in the array:

| Field | Type | Rules |
|-------|------|-------|
| eventType | enum | `invite` \| `vote_deadline` \| `booking_window_open` \| `booking_confirmation` \| `swap_suggestion` \| `fee_event` \| `score_reminder` \| `photo_approval` \| `microsite_publish` \| `itinerary_change` |
| channel | enum | `email` \| `in_app` \| `sms` |
| enabled | boolean | required |

**Response `200`:**

```json
{
  "preferences": [
    { "eventType": "invite", "channel": "email", "enabled": true },
    { "eventType": "invite", "channel": "in_app", "enabled": true },
    { "eventType": "swap_suggestion", "channel": "sms", "enabled": false }
  ]
}
```

### GET /api/users/:userId/notifications

**Query params:** `page` (optional, >= 1, default `1`), `pageSize` (optional, 1-100, default `20`).

**Response `200`:**

```json
{
  "notifications": [
    {
      "id": "uuid",
      "eventType": "booking_confirmation",
      "title": "Tee time confirmed",
      "body": "Pinehurst No. 2 on May 16 at 8:30 AM is confirmed.",
      "readAt": null,
      "createdAt": "2026-05-10T12:00:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20
}
```

---

## 13. Rounds & Scoring

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/rounds` | Trip member | List rounds for a trip |
| POST | `/api/trips/:tripId/rounds` | Trip member | Create a new round |
| GET | `/api/trips/:tripId/rounds/:roundId` | Trip member | Get round detail |
| PUT | `/api/trips/:tripId/rounds/:roundId` | Trip member | Update a round |
| POST | `/api/trips/:tripId/rounds/:roundId/finalize` | Captain only | Finalize a round |
| GET | `/api/trips/:tripId/rounds/:roundId/scores` | Trip member | Get all scores for a round |
| PUT | `/api/trips/:tripId/rounds/:roundId/scores` | Trip member | Batch upsert scores |
| GET | `/api/trips/:tripId/rounds/:roundId/scores/discrepancies` | Trip member | Get score discrepancies |

### POST /api/trips/:tripId/rounds

**Request:**

```json
{
  "courseId": "uuid",
  "roundDate": "2026-05-16",
  "format": "stroke_play"
}
```

| Field | Type | Rules |
|-------|------|-------|
| courseId | uuid | required |
| roundDate | string | required, `YYYY-MM-DD` |
| format | string? | max 50 chars |

**Response `201`:**

```json
{ "round": { "id": "uuid", "courseId": "uuid", "roundDate": "2026-05-16", "..." : "..." } }
```

### PUT /api/trips/:tripId/rounds/:roundId

Same fields as create, all optional (partial update).

### POST /api/trips/:tripId/rounds/:roundId/finalize

Captain-only. No request body required. Locks the round so scores become read-only.

**Response `200`:**

```json
{ "round": { "id": "uuid", "status": "finalized", "..." : "..." } }
```

### PUT /api/trips/:tripId/rounds/:roundId/scores

Batch upsert hole-by-hole scores for a single player.

**Request:**

```json
{
  "playerId": "uuid",
  "entries": [
    { "holeNumber": 1, "strokes": 4, "netStrokes": 3 },
    { "holeNumber": 2, "strokes": 5 }
  ]
}
```

| Field | Type | Rules |
|-------|------|-------|
| playerId | uuid | required |
| entries | array | required, 1-18 items |
| entries[].holeNumber | integer | required, 1-18 |
| entries[].strokes | integer | required, >= 1 |
| entries[].netStrokes | integer? | optional |

**Response `200`:**

```json
{ "scores": [ { "holeNumber": 1, "strokes": 4, "netStrokes": 3 }, "..." ] }
```

### GET /api/trips/:tripId/rounds/:roundId/scores/discrepancies

Returns holes where multiple scorers entered conflicting values for the same player.

**Response `200`:**

```json
{ "scores": [ { "holeNumber": 7, "playerId": "uuid", "entries": [ "..." ] } ] }
```

---

## 14. Games

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/rounds/:roundId/games` | Trip member | List games for a round |
| POST | `/api/trips/:tripId/rounds/:roundId/games` | Trip member | Create a game |
| GET | `/api/trips/:tripId/rounds/:roundId/games/:gameId` | Trip member | Get game detail |
| PUT | `/api/trips/:tripId/rounds/:roundId/games/:gameId` | Trip member | Update a game |
| GET | `/api/trips/:tripId/rounds/:roundId/games/:gameId/results` | Trip member | Calculate game results |

### POST /api/trips/:tripId/rounds/:roundId/games

**Request:**

```json
{
  "format": "nassau",
  "name": "Nassau - Front/Back/Overall",
  "templateId": "uuid-or-null",
  "teams": [
    { "name": "Team A", "playerIds": ["uuid-1", "uuid-2"] },
    { "name": "Team B", "playerIds": ["uuid-3", "uuid-4"] }
  ],
  "stakesPerPlayer": 20
}
```

| Field | Type | Rules |
|-------|------|-------|
| format | enum | required, `stroke_play` \| `best_ball` \| `skins` \| `nassau` \| `custom` |
| name | string? | max 255 chars |
| templateId | uuid? | optional, reference a game template |
| teams | array? | array of `{ name: string (max 100), playerIds: uuid[] (min 1) }` |
| stakesPerPlayer | number? | >= 0 |

**Response `201`:**

```json
{ "game": { "id": "uuid", "format": "nassau", "name": "Nassau - Front/Back/Overall", "..." : "..." } }
```

### GET /api/trips/:tripId/rounds/:roundId/games/:gameId/results

Returns computed results (standings, payouts) based on current scores.

**Response `200`:**

```json
{ "results": { "gameId": "uuid", "standings": [ "..." ], "payouts": [ "..." ] } }
```

---

## 15. Bets & Settlement

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/rounds/:roundId/bets` | Trip member | List bets for a round |
| POST | `/api/trips/:tripId/rounds/:roundId/bets` | Trip member | Create a side bet |
| GET | `/api/trips/:tripId/rounds/:roundId/bets/:betId` | Trip member | Get bet detail |
| POST | `/api/trips/:tripId/rounds/:roundId/bets/:betId/accept` | Trip member | Accept a bet |
| POST | `/api/trips/:tripId/rounds/:roundId/bets/:betId/resolve` | Captain only | Resolve a bet |

### POST /api/trips/:tripId/rounds/:roundId/bets

**Request:**

```json
{
  "name": "Closest to the pin #7",
  "amount": 10,
  "triggerDescription": "Closest tee shot to the pin on hole 7",
  "participantIds": ["uuid-1", "uuid-2", "uuid-3"],
  "roundId": "uuid-or-null"
}
```

| Field | Type | Rules |
|-------|------|-------|
| name | string? | max 255 chars |
| amount | number | required, >= 0 |
| triggerDescription | string | required, 1-2000 chars |
| participantIds | uuid[] | required, min 1 |
| roundId | uuid? | defaults to `:roundId` from URL if omitted |

**Response `201`:**

```json
{ "bet": { "id": "uuid", "amount": 10, "triggerDescription": "Closest tee shot to the pin on hole 7", "..." : "..." } }
```

### POST /api/trips/:tripId/rounds/:roundId/bets/:betId/accept

No request body required. Marks the current user as having accepted the bet.

**Response `200`:**

```json
{ "bet": { "id": "uuid", "status": "accepted", "..." : "..." } }
```

### POST /api/trips/:tripId/rounds/:roundId/bets/:betId/resolve

Captain-only. Closes the bet with an outcome.

**Request:**

```json
{ "outcome": "Jordan won -- closest at 4 feet 2 inches" }
```

| Field | Type | Rules |
|-------|------|-------|
| outcome | string | required, 1-2000 chars |

**Response `200`:**

```json
{ "bet": { "id": "uuid", "status": "resolved", "outcome": "Jordan won -- closest at 4 feet 2 inches", "..." : "..." } }
```

---

## 16. Photos & Tagging

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/photos?publishState=` | Trip member | List photos (optional filter) |
| POST | `/api/trips/:tripId/photos` | Trip member | Create photo record |
| POST | `/api/trips/:tripId/photos/upload-url` | Trip member | Get presigned upload URL |
| GET | `/api/trips/:tripId/photos/:photoId` | Trip member | Get photo detail |
| DELETE | `/api/trips/:tripId/photos/:photoId` | Uploader or Captain | Delete a photo |
| POST | `/api/trips/:tripId/photos/:photoId/tags` | Trip member | Tag users in a photo |
| POST | `/api/trips/:tripId/photos/:photoId/nominate` | Trip member | Nominate photo for publication |

### POST /api/trips/:tripId/photos

**Request:**

```json
{ "caption": "Sunset on the 18th green" }
```

| Field | Type | Rules |
|-------|------|-------|
| caption | string? | max 500 chars |

**Response `201`:**

```json
{ "photo": { "id": "uuid", "caption": "Sunset on the 18th green", "..." : "..." } }
```

### POST /api/trips/:tripId/photos/upload-url

No request body required. Returns a presigned URL for direct upload.

**Response `200`:**

```json
{ "uploadUrl": "https://s3.amazonaws.com/...", "key": "photos/uuid.jpg" }
```

### POST /api/trips/:tripId/photos/:photoId/tags

**Request:**

```json
{ "userIds": ["uuid-1", "uuid-2"] }
```

| Field | Type | Rules |
|-------|------|-------|
| userIds | uuid[] | required, min 1 |

**Response `201`:**

```json
{ "tags": [ { "photoId": "uuid", "userId": "uuid-1" }, { "photoId": "uuid", "userId": "uuid-2" } ] }
```

### POST /api/trips/:tripId/photos/:photoId/nominate

No request body required. Nominates the photo for inclusion in the microsite. Triggers consent requests for tagged users.

**Response `200`:**

```json
{ "photo": { "id": "uuid", "publishState": "pending_consent", "..." : "..." } }
```

---

## 17. Photo Consent

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/trips/:tripId/photos/:photoId/consent` | Trip member | Submit consent decision |
| POST | `/api/trips/:tripId/photos/:photoId/takedown` | Trip member | Request takedown of published photo |
| GET | `/api/trips/:tripId/photos/consent-queue` | Trip member | Get photos awaiting user's consent |
| GET | `/api/trips/:tripId/photos/audit-log` | Trip member | Get consent audit log for the trip |

### POST /api/trips/:tripId/photos/:photoId/consent

**Request:**

```json
{ "decision": "approved" }
```

| Field | Type | Rules |
|-------|------|-------|
| decision | enum | required, `approved` \| `vetoed` |

**Response `200`:**

```json
{ "consent": { "photoId": "uuid", "userId": "uuid", "decision": "approved", "..." : "..." } }
```

### POST /api/trips/:tripId/photos/:photoId/takedown

No request body required. Tagged user can request takedown of an already-published photo.

**Response `200`:**

```json
{ "photo": { "id": "uuid", "publishState": "taken_down", "..." : "..." } }
```

### GET /api/trips/:tripId/photos/consent-queue

Returns photos where the current user has been tagged and has not yet submitted a consent decision.

**Response `200`:**

```json
{ "queue": [ { "photoId": "uuid", "caption": "...", "nominatedBy": "uuid", "..." : "..." } ] }
```

### GET /api/trips/:tripId/photos/audit-log

Returns the full consent audit trail for all photos in the trip.

**Response `200`:**

```json
{ "log": [ { "photoId": "uuid", "userId": "uuid", "action": "approved", "timestamp": "2026-05-17T10:00:00Z" } ] }
```

---

## 18. Microsites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/microsite` | Trip member | Get microsite config |
| PUT | `/api/trips/:tripId/microsite` | Captain only | Create or update microsite |
| POST | `/api/trips/:tripId/microsite/publish` | Captain only | Publish the microsite |
| PUT | `/api/trips/:tripId/microsite/visibility` | Captain only | Set visibility mode |
| POST | `/api/trips/:tripId/microsite/unpublish` | Captain only | Unpublish the microsite |
| GET | `/api/recaps/:slug` | None (public) | View a published microsite |

### PUT /api/trips/:tripId/microsite

**Request:**

```json
{
  "selectedAssetIds": ["uuid-1", "uuid-2", "uuid-3"],
  "content": { "headline": "Pinehurst 2026", "summary": "An unforgettable trip" }
}
```

| Field | Type | Rules |
|-------|------|-------|
| selectedAssetIds | uuid[]? | photos to include |
| content | Record<string, unknown>? | freeform microsite content |

**Response `200`:**

```json
{ "microsite": { "tripId": "uuid", "selectedAssetIds": ["..."], "content": { "..." : "..." }, "..." : "..." } }
```

### POST /api/trips/:tripId/microsite/publish

Captain-only. No request body required. Publishes the microsite at its generated slug.

**Response `200`:**

```json
{ "microsite": { "tripId": "uuid", "slug": "pinehurst-2026-abc123", "status": "published", "..." : "..." } }
```

### PUT /api/trips/:tripId/microsite/visibility

**Request:**

```json
{ "mode": "public" }
```

| Field | Type | Rules |
|-------|------|-------|
| mode | enum | required, `unlisted` \| `public` |

**Response `200`:**

```json
{ "microsite": { "tripId": "uuid", "visibilityMode": "public", "..." : "..." } }
```

### POST /api/trips/:tripId/microsite/unpublish

Captain-only. No request body required. Takes the microsite offline.

**Response `200`:**

```json
{ "microsite": { "tripId": "uuid", "status": "unpublished", "..." : "..." } }
```

### GET /api/recaps/:slug

Public route -- no authentication required. Returns the published microsite for the given slug. Returns `X-Robots-Tag: noindex, nofollow` header for unlisted microsites.

**Response `200`:**

```json
{ "microsite": { "tripId": "uuid", "slug": "pinehurst-2026-abc123", "visibilityMode": "public", "content": { "..." : "..." }, "..." : "..." } }
```

---

## 19. Trip Expenses & Cost Splitting

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/expenses` | Trip member | List all expenses |
| POST | `/api/trips/:tripId/expenses` | Trip member | Create an expense |
| PUT | `/api/trips/:tripId/expenses/:expenseId` | Creator or Captain | Update an expense |
| DELETE | `/api/trips/:tripId/expenses/:expenseId` | Creator or Captain | Delete an expense |
| GET | `/api/trips/:tripId/expenses/settlement` | Trip member | Calculate settlement balances |
| GET | `/api/trips/:tripId/expenses/settlement/actions` | Trip member | List settlement actions |
| POST | `/api/trips/:tripId/expenses/settlement/actions` | Trip member | Generate payment deep links |

### POST /api/trips/:tripId/expenses

**Request:**

```json
{
  "description": "Group dinner at 195 American",
  "amount": 480,
  "category": "meal",
  "splitMethod": "equal",
  "customSplits": null,
  "excludedUserIds": ["uuid-of-absent-golfer"]
}
```

| Field | Type | Rules |
|-------|------|-------|
| description | string | required, 1-500 chars |
| amount | number | required, >= 0 |
| category | enum | required, `tee_time` \| `lodging` \| `meal` \| `transport` \| `other` |
| splitMethod | enum | `equal` \| `custom` \| `exclude`, default `equal` |
| customSplits | array? | array of `{ userId: uuid, amount: number (>= 0) }` |
| excludedUserIds | uuid[]? | users excluded from the split |

**Response `201`:**

```json
{ "expense": { "id": "uuid", "description": "Group dinner at 195 American", "amount": 480, "category": "meal", "..." : "..." } }
```

### PUT /api/trips/:tripId/expenses/:expenseId

Same fields as create, all optional (partial update). Only the expense creator or the trip captain can update.

### DELETE /api/trips/:tripId/expenses/:expenseId

Only the expense creator or the trip captain can delete. Returns `{ "success": true }` on success.

### GET /api/trips/:tripId/expenses/settlement

Calculates who owes whom, based on all trip expenses and their split rules.

**Response `200`:**

```json
{
  "settlement": {
    "balances": [
      { "userId": "uuid-1", "netBalance": -120.50 },
      { "userId": "uuid-2", "netBalance": 120.50 }
    ],
    "transfers": [
      { "from": "uuid-2", "to": "uuid-1", "amount": 120.50 }
    ]
  }
}
```

### POST /api/trips/:tripId/expenses/settlement/actions

Generates payment deep links (e.g., Venmo, Zelle) for the calculated settlement transfers.

**Response `201`:**

```json
{
  "actions": [
    { "from": "uuid-2", "to": "uuid-1", "amount": 120.50, "venmoLink": "https://venmo.com/...", "zelleLink": "..." }
  ]
}
```

---

## 20. Travel Add-Ons (Lodging & Flights)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/trips/:tripId/lodging/search` | Trip member | Search lodging options |
| GET | `/api/trips/:tripId/lodging/options` | Trip member | List saved lodging options |
| POST | `/api/trips/:tripId/lodging/options` | Trip member | Save a lodging option |
| POST | `/api/trips/:tripId/flights/search` | Trip member | Search flight options |
| GET | `/api/trips/:tripId/flights/options` | Trip member | List saved flight options |
| POST | `/api/trips/:tripId/flights/options` | Trip member | Save a flight option |

### POST /api/trips/:tripId/lodging/search

**Request:**

```json
{
  "location": "Pinehurst, NC",
  "checkIn": "2026-05-15",
  "checkOut": "2026-05-18",
  "guests": 4,
  "budgetMax": 300
}
```

| Field | Type | Rules |
|-------|------|-------|
| location | string? | max 255 chars |
| checkIn | string | required, `YYYY-MM-DD` |
| checkOut | string | required, `YYYY-MM-DD` |
| guests | integer | required, >= 1 |
| budgetMax | number? | >= 0 |

**Response `200`:**

```json
{
  "results": [
    { "name": "Pinehurst Resort", "pricePerNight": 250, "totalPrice": 750, "linkUrl": "https://...", "..." : "..." }
  ]
}
```

### POST /api/trips/:tripId/lodging/options

**Request:**

```json
{
  "name": "Pinehurst Resort",
  "location": {
    "address": "1 Carolina Vista Dr",
    "city": "Pinehurst",
    "state": "NC",
    "lat": 35.195,
    "lng": -79.469
  },
  "checkIn": "2026-05-15",
  "checkOut": "2026-05-18",
  "guests": 4,
  "pricePerNight": 250,
  "totalPrice": 750,
  "bedrooms": 2,
  "linkUrl": "https://pinehurst.com/booking/123",
  "thumbnailUrl": "https://pinehurst.com/images/room.jpg"
}
```

| Field | Type | Rules |
|-------|------|-------|
| name | string | required, 1-255 chars |
| location | object? | `{ address?, city?, state?, lat?, lng? }` |
| checkIn | string | required, `YYYY-MM-DD` |
| checkOut | string | required, `YYYY-MM-DD` |
| guests | integer | required, >= 1 |
| pricePerNight | number? | >= 0 |
| totalPrice | number? | >= 0 |
| bedrooms | integer? | >= 0 |
| linkUrl | string | required, valid URL, max 500 chars |
| thumbnailUrl | string? | valid URL, max 500 chars |

**Response `201`:**

```json
{ "option": { "id": "uuid", "name": "Pinehurst Resort", "checkIn": "2026-05-15", "..." : "..." } }
```

### POST /api/trips/:tripId/flights/search

**Request:**

```json
{
  "departureAirport": "ATL",
  "arrivalAirport": "RDU",
  "departureDate": "2026-05-15",
  "returnDate": "2026-05-18",
  "passengers": 2
}
```

| Field | Type | Rules |
|-------|------|-------|
| departureAirport | string | required, 2-10 chars |
| arrivalAirport | string | required, 2-10 chars |
| departureDate | string | required, `YYYY-MM-DD` |
| returnDate | string? | `YYYY-MM-DD` |
| passengers | integer | >= 1, default `1` |

**Response `200`:**

```json
{
  "results": [
    { "airline": "Delta", "departureTime": "2026-05-15T08:00:00Z", "arrivalTime": "2026-05-15T10:15:00Z", "price": 189, "..." : "..." }
  ]
}
```

### POST /api/trips/:tripId/flights/options

**Request:**

```json
{
  "airline": "Delta",
  "departureAirport": "ATL",
  "arrivalAirport": "RDU",
  "departureTime": "2026-05-15T08:00:00Z",
  "arrivalTime": "2026-05-15T10:15:00Z",
  "price": 189,
  "passengers": 2,
  "linkUrl": "https://delta.com/booking/abc"
}
```

| Field | Type | Rules |
|-------|------|-------|
| airline | string? | max 100 chars |
| departureAirport | string | required, 2-10 chars |
| arrivalAirport | string | required, 2-10 chars |
| departureTime | string | required, ISO 8601 datetime |
| arrivalTime | string | required, ISO 8601 datetime |
| price | number? | >= 0 |
| passengers | integer | >= 1, default `1` |
| linkUrl | string? | valid URL, max 500 chars |

**Response `201`:**

```json
{ "option": { "id": "uuid", "airline": "Delta", "departureAirport": "ATL", "..." : "..." } }
```
