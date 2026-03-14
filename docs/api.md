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
