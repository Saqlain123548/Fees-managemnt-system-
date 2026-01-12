-- Add join_date column to students table
-- This migration adds the missing join_date column that the application expects

DO $$
BEGIN
    -- Check if join_date column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'students'
        AND column_name = 'join_date'
    ) THEN
        -- Add the join_date column
        ALTER TABLE public.students ADD COLUMN join_date DATE DEFAULT CURRENT_DATE;

        -- Update existing records to set join_date to created_at date if not set
        UPDATE public.students
        SET join_date = DATE(created_at)
        WHERE join_date IS NULL;

        -- Make join_date NOT NULL after setting defaults
        ALTER TABLE public.students ALTER COLUMN join_date SET NOT NULL;

        RAISE NOTICE 'join_date column added to students table successfully';
    ELSE
        RAISE NOTICE 'join_date column already exists in students table';
    END IF;
END $$;

-- Add index for join_date
CREATE INDEX IF NOT EXISTS idx_students_join_date ON public.students(join_date);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
