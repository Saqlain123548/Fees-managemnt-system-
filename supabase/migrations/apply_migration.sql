-- =====================================================
-- MIGRATION SCRIPT FOR FEES MANAGEMENT SYSTEM
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Step 1: Check if students table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'students'
    ) THEN
        -- Create students table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.students (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            contact TEXT,
            join_date DATE NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Allow authenticated users to view students"
            ON public.students FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Allow authenticated users to insert students"
            ON public.students FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "Allow authenticated users to update students"
            ON public.students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
        CREATE POLICY "Allow authenticated users to delete students"
            ON public.students FOR DELETE TO authenticated USING (true);
            
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
        CREATE INDEX IF NOT EXISTS idx_students_is_active ON public.students(is_active);
        CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at DESC);
        
        RAISE NOTICE 'Students table created successfully';
    ELSE
        RAISE NOTICE 'Students table already exists';
    END IF;
END $$;

-- Step 2: Check if fees_records table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'fees_records'
    ) THEN
        -- Create fees_records table if it doesn't exist
        CREATE TABLE IF NOT EXISTS public.fees_records (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
            amount DECIMAL(10, 2) NOT NULL,
            payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
            payment_method TEXT DEFAULT 'cash',
            notes TEXT,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.fees_records ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Allow authenticated users to view fees records"
            ON public.fees_records FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Allow authenticated users to insert fees records"
            ON public.fees_records FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "Allow authenticated users to delete fees records"
            ON public.fees_records FOR DELETE TO authenticated USING (true);
            
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_fees_records_student_id ON public.fees_records(student_id);
        CREATE INDEX IF NOT EXISTS idx_fees_records_created_at ON public.fees_records(created_at DESC);
        
        RAISE NOTICE 'Fees records table created successfully';
    ELSE
        RAISE NOTICE 'Fees records table already exists';
    END IF;
END $$;

-- Step 3: Refresh schema cache (important for Supabase to recognize new tables)
NOTIFY pgrst, 'reload schema';

-- Step 4: Verify tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'fees_records')
ORDER BY table_name;

-- Step 5: Create helper function to verify schema cache
CREATE OR REPLACE FUNCTION public.verify_schema_cache()
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_object_agg(
            table_name, 
            (SELECT COUNT(*) FROM information_schema.columns 
             WHERE table_schema = 'public' AND table_name = t.table_name)
        )
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
        AND table_name IN ('students', 'fees_records')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.verify_schema_cache() TO authenticated;

-- Final success message
SELECT 'Migration completed successfully!' as status, 
       (SELECT json_object_agg(table_name, column_count) FROM (
           SELECT table_name, COUNT(*) as column_count
           FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name IN ('students', 'fees_records')
           GROUP BY table_name
       ) sub) as tables_created;

