# Admin User Management Guide

## Accessing Admin Panel

1. Login as an admin user:
   - **Email:** admin@campus.edu or sahil@gmail.com
   - **Password:** admin123 (default) or 2005 (for Sahil)
   
2. Navigate to `/admin/users` to access user management

## Admin Features

### User Directory
- **Search:** Search users by name, email, or UUCMS number
- **View Profile:** Click "View Public Profile" to see user's public profile
- **Delete User:** Click trash icon to delete a user (irreversible)

### What Happens When You Delete a User

When an admin deletes a user account, the following data is automatically cleaned up:
- ✅ All posted items (lost/found listings)
- ✅ All item claims submitted by that user
- ✅ All messages sent and received
- ✅ All notifications sent and received
- ✅ All follower/following relationships
- ✅ User account itself

This is a **cascade delete** operation that maintains database integrity.

## Database Architecture

### Tables
- **users** - Store user accounts with profiles
- **items** - Store lost/found listings (auto-approved on creation)
- **claims** - Store ownership claims on items
- **messages** - Store direct messages between users
- **notifications** - Store system notifications
- **follows** - Store follow relationships

### Foreign Keys
All tables properly use foreign key constraints with ON DELETE CASCADE:
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

## API Endpoints

### Admin Users Endpoints
```
DELETE /api/admin/users/:id
- Requires: Admin authentication token
- Parameters: User ID to delete
- Returns: { success: true } on success
- Error: Cannot delete own account
```

### Item Management Endpoints
```
PUT /api/admin/items/:id/status
- Update item status (pending, approved, rejected, returned)

GET /api/admin/items
- List all items with filters
```

## Safety Features

✅ **Admin Cannot Delete Themselves**
- System prevents an admin from deleting their own account
- Ensures at least one admin always remains

✅ **Confirmation Dialogs**
- User deletion requires explicit confirmation
- Shows warning about data loss

✅ **Error Handling**
- All operations have proper error messages
- Failed operations don't corrupt database
- Toast notifications inform about results

## Database Connection

The app uses **SQLite** (campus_lost_found.db) for data persistence:
- Local file-based database
- Perfect for development and small deployments
- Can be replaced with MySQL using environment variables:
  ```
  MYSQL_HOST=localhost
  MYSQL_USER=root
  MYSQL_PASSWORD=password
  MYSQL_DATABASE=campus_lost_found
  ```

## Monitoring

Check server logs to monitor:
- User deletions: `[Delete User Error]` messages
- Database operations: `[DB] Using SQLite/MySQL`
- API requests: Endpoint logs on `/api` calls
