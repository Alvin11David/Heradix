# API Endpoints Reference for UI Annotations

## AUTH

### POST /api/auth/login
**Body:** { email, password }
**Response:** { token, user }

### POST /api/auth/register
**Body:** { email, password, name }
**Response:** { token, user }

### POST /api/auth/logout
**Response:** success

## ASSETS

### GET /api/assets
**Params:** q, format, orientation, page
**Response:** Asset[]

### GET /api/assets/:slug
**Response:** Asset with details

### POST /api/assets/:id/download
**Response:** { downloadUrl }

## COLLECTIONS

### GET /api/collections
**Response:** Collection[]

### GET /api/collections/:id
**Response:** Collection with assets

### POST /api/collections
**Body:** { name, description }
**Response:** Collection

### POST /api/collections/:id/assets
**Body:** { assetId }
**Response:** success

## SUBSCRIPTION

### GET /api/subscription/plans
**Response:** Plan[]

### POST /api/subscription/subscribe
**Body:** { planId }
**Response:** Subscription

