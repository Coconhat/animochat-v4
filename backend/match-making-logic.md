# Matchmaking Algorithm Documentation

## Overview

This matchmaking system is designed for **small to medium userbase** anonymous chat applications (like Omegle). It uses a hybrid approach combining **multiple waiting queues** with **compatibility scoring** to reduce repetitive matches while ensuring users can still find partners.

---

## Core Concepts

### 1. **Multiple Waiting Rooms (3 Queues)**

Instead of one global queue, users are distributed across 3 separate waiting rooms:

```
queue:room1  →  [User A, User D, User G]
queue:room2  →  [User B, User E, User H]
queue:room3  →  [User C, User F, User I]
```

**Why?**

- Naturally spreads users apart after matching
- Reduces immediate re-matches
- Maintains fast matching speed

---

### 2. **Compatibility Scoring System**

Each time two users match, their compatibility score decreases for future matches:

| Match Count     | Compatibility Score | Description                          |
| --------------- | ------------------- | ------------------------------------ |
| 0 (First time)  | 100%                | Always match if found                |
| 1 (Second time) | 70%                 | High chance of matching              |
| 2 (Third time)  | 40%                 | Medium chance                        |
| 3 (Fourth time) | 20%                 | Low chance                           |
| 4+ times        | 10%                 | Very low chance (but still possible) |

**Why decreasing scores?**

- Prevents boring repetitive matches
- Still allows re-matching for small userbases
- No one gets permanently blocked

---

## Algorithm Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Requests Match                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Remove user from all queues (prevent duplicates)         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Try to find partner from queues (shuffled random order)  │
│    - Pop candidate from queue (atomic SPOP operation)       │
│    - Check if candidate socket is alive                     │
│    - Calculate compatibility score                          │
│    - Roll dice: random(0-100) vs compatibility score        │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    ┌─────┴─────┐
                    │           │
              Compatible?   Incompatible?
                    │           │
                    ↓           ↓
         ┌──────────────┐   ┌──────────────────────┐
         │ MATCH FOUND! │   │ Put candidate back   │
         │              │   │ in different queue   │
         └──────────────┘   └──────────────────────┘
                 ↓                      ↓
         ┌──────────────┐         ┌────────────┐
         │ Create Room  │         │ Try next   │
         │ Join both    │         │ candidate  │
         │ Record match │         └────────────┘
         │ Notify users │               ↓
         └──────────────┘         (Retry up to 10 times)
                 ↓
         ┌──────────────┐
         │ Chat Session │
         └──────────────┘
                 ↓
         ┌──────────────┐
         │ User leaves  │
         └──────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. After match ends:                                        │
│    - User A → Random queue (room1, room2, or room3)         │
│    - User B → Random queue (room1, room2, or room3)         │
│    - Match count incremented for both                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### ✅ **Ghost User Prevention**

- Validates socket connection before matching
- Removes disconnected users from queues
- Periodic cleanup every 30 seconds

### ✅ **Atomic Operations**

- Uses Redis `SPOP` (atomic pop) to prevent race conditions
- No two matchmaking processes can grab the same user

### ✅ **Retry Logic**

- Tries up to 10 times to find a compatible partner
- Searches all 3 queues in random order
- Puts incompatible users back in different queues

### ✅ **No Permanent Blocking**

- Even users who matched 10 times still have 10% chance
- Prevents queue starvation in small userbases

---

## Data Structures (Redis)

### Queues (Redis Sets)

```
queue:room1  →  Set of socket IDs
queue:room2  →  Set of socket IDs
queue:room3  →  Set of socket IDs
```

### Match Count (Redis String)

```
match:count:socketA:socketB  →  "3"  (matched 3 times)
match:count:socketB:socketA  →  "3"  (bidirectional)
```

- **TTL:** 2 hours (shorter for small userbase)
- **Auto-expires** so users can match again after a break

### User Data (Redis Hash)

```
user:socketA  →  {
  userId: "socketA",
  socketId: "socketA",
  isBusy: true/false,
  currentRoomId: "room-uuid",
  connectedAt: 1234567890
}
```

---

## Configuration Parameters

### For Small Userbase (10-50 users)

```typescript
MATCH_HISTORY_EXPIRY = 60 * 60 * 2;  // 2 hours
MAX_RETRY_ATTEMPTS = 10;

// Compatibility scores:
case 0: return 100;
case 1: return 70;
case 2: return 40;
case 3: return 20;
default: return 10;
```

### For Medium Userbase (50-200 users)

```typescript
MATCH_HISTORY_EXPIRY = 60 * 60 * 4;  // 4 hours
MAX_RETRY_ATTEMPTS = 8;

// Stricter scoring:
case 0: return 100;
case 1: return 60;
case 2: return 30;
case 3: return 15;
default: return 5;
```

### For Large Userbase (200+ users)

```typescript
MATCH_HISTORY_EXPIRY = 60 * 60 * 24;  // 24 hours
MAX_RETRY_ATTEMPTS = 5;

// Very strict:
case 0: return 100;
case 1: return 50;
case 2: return 20;
case 3: return 5;
default: return 0;  // Block after 3 matches
```

---

## Example Scenarios

### Scenario 1: First Time Match

```
User A searches
  ↓
Finds User B in queue:room2
  ↓
Compatibility: 100% (never matched before)
  ↓
Dice roll: Any number (0-100) ≤ 100
  ↓
✅ MATCH! Create room and chat
```

### Scenario 2: Second Time Match

```
User A searches again
  ↓
Finds User B again in queue:room1
  ↓
Compatibility: 70% (matched once before)
  ↓
Dice roll: 45
  ↓
45 ≤ 70? YES
  ↓
✅ MATCH! (70% chance succeeded)
```

### Scenario 3: Incompatible Match

```
User A searches
  ↓
Finds User B (matched 3 times already)
  ↓
Compatibility: 20%
  ↓
Dice roll: 85
  ↓
85 ≤ 20? NO
  ↓
❌ Move User B to different queue
  ↓
Try next candidate in queue
```

---

## Performance Considerations

### Time Complexity

- **Queue operations:** O(1) (Redis SPOP/SADD)
- **Compatibility check:** O(1) (Redis GET)
- **Worst case matching:** O(Q × R) where Q = 3 queues, R = 10 retries

### Space Complexity

- **Per user:** ~500 bytes (user data + queue membership)
- **Per match history:** ~100 bytes × 2 (bidirectional)
- **Total for 100 users:** ~50KB + match histories

### Scalability

- **Single Redis instance:** 1000+ concurrent users
- **Horizontal scaling:** Use Redis Cluster + Socket.IO Redis Adapter
- **Multi-region:** Regional Redis instances with separate queues

---

## Monitoring & Debugging

### Queue Stats Endpoint

```typescript
GET /api/queue-stats
Response:
{
  "queue:room1": 5,
  "queue:room2": 3,
  "queue:room3": 7
}
```

### Logs to Watch

```
🔎 User searching for match
🎲 Compatibility check with dice roll
🎉 MATCH successful
👻 Ghost user cleanup
⏳ User added to queue
🔄 User moved to different queue (incompatible)
```

---

## Potential Issues & Solutions

### Issue 1: Unbalanced Queues

**Problem:** One queue has 20 users, others have 0

**Solution:**

```typescript
// Periodically rebalance queues
async function rebalanceQueues() {
  // Move users from full queues to empty ones
}
```

### Issue 2: Queue Thrashing

**Problem:** Users keep getting rejected due to low compatibility

**Solution:**

- Increase compatibility scores
- Reduce match history expiry time
- Add a "desperation mode" after 5 failed attempts

### Issue 3: Ghost Users Accumulate

**Problem:** Disconnected users stay in queues

**Solution:**

- Current implementation has periodic cleanup (every 30s)
- Validate socket before matching
- Clean up on disconnect event

---

## Future Improvements

### 1. **Interest-Based Matching**

```typescript
// Match users with similar interests
interface UserProfile {
  interests: string[];
  language: string;
  ageGroup: string;
}
```

### 2. **Time-Based Priority**

```typescript
// Users waiting longer get higher priority
const waitTime = Date.now() - user.joinedQueueAt;
const priorityBoost = Math.min(waitTime / 1000 / 60, 30); // Max 30% boost
```

### 3. **Regional Queues**

```typescript
// Separate queues by region for better latency
const QUEUES = {
  "us-east": ["queue:us-east:1", "queue:us-east:2"],
  "eu-west": ["queue:eu-west:1", "queue:eu-west:2"],
  asia: ["queue:asia:1", "queue:asia:2"],
};
```

---

## Testing

### Unit Tests

```typescript
describe("Matchmaking", () => {
  test("should match two new users with 100% compatibility", async () => {
    // Test implementation
  });

  test("should reduce compatibility after multiple matches", async () => {
    // Test implementation
  });

  test("should handle ghost users gracefully", async () => {
    // Test implementation
  });
});
```

### Load Testing

```bash
# Simulate 100 concurrent users
npm run test:load -- --users 100 --duration 60s
```

---
