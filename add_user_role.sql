-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'Administrador' AFTER email;

-- Update existing users to have admin role
UPDATE users SET role = 'Administrador' WHERE role IS NULL OR role = '';
