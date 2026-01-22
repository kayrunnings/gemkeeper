# Folders Feature - Manual Test Checklist

## KAY-16: End-to-End Testing

### Prerequisites
- [ ] App is running locally (`npm run dev`)
- [ ] Logged in with a valid user account
- [ ] Database is accessible

---

## Folder CRUD Operations

### Create Folder
- [ ] Click "+" button in Folders section header
- [ ] Inline input appears with focus
- [ ] Type folder name and press Enter - folder is created
- [ ] Click checkmark button - folder is created
- [ ] Click outside input (blur) with text - folder is created
- [ ] Click outside input (blur) without text - input is dismissed
- [ ] Press Escape - input is dismissed
- [ ] Click X button - input is dismissed
- [ ] Loading spinner shows during creation
- [ ] Folder appears in alphabetical order after creation
- [ ] Empty/whitespace-only names are rejected

### Rename Folder
- [ ] Double-click folder name - enters edit mode
- [ ] Context menu > Rename - enters edit mode
- [ ] Edit text and press Enter - folder is renamed
- [ ] Click checkmark button - folder is renamed
- [ ] Click outside input (blur) with text - folder is renamed
- [ ] Click outside input (blur) without text - rename is cancelled
- [ ] Press Escape - rename is cancelled
- [ ] Click X button - rename is cancelled
- [ ] Loading spinner shows during rename
- [ ] Folder re-sorts alphabetically after rename
- [ ] Empty/whitespace-only names cancel the rename

### Delete Folder
- [ ] Context menu > Delete shows confirmation
- [ ] Cancel confirmation - folder is not deleted
- [ ] Confirm deletion - folder is deleted
- [ ] Notes in deleted folder become "Unfiled"
- [ ] Note count in "Unfiled" increases appropriately
- [ ] If viewing deleted folder, navigates to "All Notes"

---

## Navigation & Filtering

### Sidebar Navigation
- [ ] "All Notes" shows all user's notes
- [ ] "Favorites" shows only favorited notes
- [ ] Clicking a folder shows only notes in that folder
- [ ] "Unfiled" shows notes without a folder
- [ ] Selected item is visually highlighted (primary color)
- [ ] Note counts are accurate for each item

### Note Counts
- [ ] All Notes count = total number of notes
- [ ] Favorites count = number of favorited notes
- [ ] Folder count = number of notes in that folder
- [ ] Unfiled count = number of notes without folder

---

## Move to Folder

### From Note Card
- [ ] Hover over note card shows folder icon button
- [ ] Click folder icon opens dropdown menu
- [ ] All folders listed with folder icon
- [ ] "Unfiled" option at bottom with separator
- [ ] Current folder has checkmark indicator
- [ ] Selecting a folder moves the note
- [ ] Selecting "Unfiled" removes folder assignment
- [ ] Note counts update immediately after move

### Visual Feedback
- [ ] Note card shows current folder name (if assigned)
- [ ] Folder name truncates if too long

---

## Edge Cases

### Long Folder Names
- [ ] Folder names up to 100 characters are accepted
- [ ] Long names truncate with ellipsis in sidebar
- [ ] Long names display properly in note card
- [ ] Long names display properly in move dropdown

### Empty States
- [ ] "No folders yet" shown when no folders exist
- [ ] Empty folder shows 0 count
- [ ] "No notes found" when folder is empty

### Multiple Users
- [ ] User can only see their own folders
- [ ] User can only see their own notes
- [ ] Moving notes only affects current user's data

### Rapid Actions
- [ ] Cannot create while already creating (button disabled)
- [ ] Cannot rename while already renaming (button disabled)
- [ ] Multiple quick clicks don't cause issues

---

## Mobile Responsiveness

### Sidebar
- [ ] Hamburger menu button visible on mobile
- [ ] Clicking opens sidebar overlay
- [ ] Clicking outside closes sidebar
- [ ] Clicking a nav item closes sidebar
- [ ] Sidebar scrolls if many folders

### Note Cards
- [ ] Cards stack vertically on mobile
- [ ] Folder dropdown is accessible on touch
- [ ] All action buttons are tappable

---

## Integration Tests

### New Note in Folder
- [ ] When viewing a folder, "New Note" creates note in that folder
- [ ] Note appears in current folder view
- [ ] Note appears in "All Notes" view
- [ ] Note does NOT appear in other folder views

### Refresh Persistence
- [ ] Refresh page - data persists
- [ ] Selected filter resets to "All Notes" (expected behavior)
- [ ] All folders and notes load correctly

---

## Performance

- [ ] Sidebar renders quickly with 10+ folders
- [ ] Note list renders quickly with 50+ notes
- [ ] Moving notes doesn't cause lag
- [ ] No console errors during normal usage

---

## Bugs Found & Fixed

1. **Input blur handling** - Fixed: Inputs now save on blur if text exists, cancel if empty
2. **Loading states** - Fixed: Added loading spinner and disabled state during operations
3. **Max length** - Fixed: Added maxLength=100 to folder name inputs

---

## Sign-off

- [ ] All tests passed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Ready for production

Tested by: _________________
Date: _________________
