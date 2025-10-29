-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, identifications_used, last_reset_date, monthly_identifications)
  VALUES (
    NEW.id,
    0,
    NOW(),
    5
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all existing users have profiles with proper defaults
INSERT INTO public.profiles (id, identifications_used, last_reset_date, monthly_identifications)
SELECT 
  id,
  0,
  NOW(),
  5
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  identifications_used = COALESCE(profiles.identifications_used, 0),
  last_reset_date = COALESCE(profiles.last_reset_date, NOW()),
  monthly_identifications = COALESCE(profiles.monthly_identifications, 5);

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile with default values when a new user signs up';
