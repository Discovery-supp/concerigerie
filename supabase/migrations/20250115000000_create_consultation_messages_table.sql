-- Create consultation_messages table
CREATE TABLE IF NOT EXISTS consultation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_consultation_messages_created_at ON consultation_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_status ON consultation_messages(status);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_email ON consultation_messages(email);

-- Enable Row Level Security
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert consultation messages (public access)
CREATE POLICY "Allow public to insert consultation messages" ON consultation_messages
    FOR INSERT WITH CHECK (true);

-- Create policy to allow authenticated users to read consultation messages
CREATE POLICY "Allow authenticated users to read consultation messages" ON consultation_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update consultation messages
CREATE POLICY "Allow authenticated users to update consultation messages" ON consultation_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consultation_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_consultation_messages_updated_at
    BEFORE UPDATE ON consultation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_consultation_messages_updated_at();

-- Add comments for documentation
COMMENT ON TABLE consultation_messages IS 'Table to store consultation messages from the contact form';
COMMENT ON COLUMN consultation_messages.status IS 'Status of the message: new, read, or replied';
COMMENT ON COLUMN consultation_messages.created_at IS 'Timestamp when the message was created';
COMMENT ON COLUMN consultation_messages.updated_at IS 'Timestamp when the message was last updated';

