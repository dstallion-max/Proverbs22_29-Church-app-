import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hyejyfykoxorsrvxtswv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZWp5Znlrb3hvcnNydnh0c3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Nzc3MTAsImV4cCI6MjEwNzA1MzcxMH0.mFPfVuaAE979PIDYxAsmru9mCOCpqdRzaTEUPvU6IoI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSms() {
  const phone = '+2348023035878';

  console.log('Sending OTP to', phone);

  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success! OTP sent.');
    console.log('Check your phone for the SMS.');
    console.log('Watch the backend terminal for logs.');
  }
}

testSms();