ALTER TABLE reservations ADD COLUMN staff_id UUID REFERENCES staff(id);
