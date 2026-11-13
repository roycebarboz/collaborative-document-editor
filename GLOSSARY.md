# Docs

A lightweight collaborative document editor: users write rich-text documents and share them with other users.

## Language

### People

**User**:
One of the seeded people who can sign in to the product.
_Avoid_: Account, member

**Owner**:
The User who created a Document. Every Document has exactly one Owner, and only the Owner can Share it.
_Avoid_: Author, creator, admin

**Collaborator**:
A User, other than the Owner, who has been granted access to a Document. A Collaborator can edit and rename it but cannot Share it.
_Avoid_: Viewer, guest, shared user, editor

### Documents

**Document**:
A titled piece of rich-text content belonging to one Owner.
_Avoid_: File, page, note, doc

**Share**:
The act of an Owner granting a named User access to a Document, making them a Collaborator. Shares are never revoked.
_Avoid_: Invite, permission, grant

**My documents**:
The Documents a User owns.
_Avoid_: Owned docs, my files

**Shared with me**:
The Documents a User is a Collaborator on.
_Avoid_: Shared docs, inbox

**Import**:
Creating a new Document from an uploaded `.txt` file.
_Avoid_: Upload (when talking about the result), attachment
