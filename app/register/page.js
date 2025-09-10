
"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select"; // Import our new component

// --- Interest Options ---
const interestOptions = [
  { value: 'Photography', label: 'Photography' },
  { value: 'Videography', label: 'Videography' },
  { value: 'Web Development', label: 'Web Development' },
  { value: 'Web Designing', label: 'Web Designing' },
  { value: 'Graphic Designing', label: 'Graphic Designing' },
  { value: 'Content Creation', label: 'Content Creation' },
  { value: 'Video Editing', label: 'Video Editing' },
  { value: 'Photo Editing', label: 'Photo Editing' },
  { value: 'Robotics', label: 'Robotics' },
  { value: 'Cybersecurity', label: 'Cybersecurity' },
  { value: 'Other', label: 'Other' }, // The special "Other" option
];


export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [registerNumber, setRegisterNumber] = useState(""); // <-- ADD THIS LINE
  
  // --- New states for interests ---
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [otherInterest, setOtherInterest] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(""); // <-- ADDED FOR OTP INPUT
  const [otpSent, setOtpSent] = useState(false); // <-- ADDED TO TRACK OTP STATUS
  const [otpVerified, setOtpVerified] = useState(false); // <-- ADDED TO TRACK OTP VERIFICATION
  const [otpMessage, setOtpMessage] = useState(""); // <-- ADDED FOR OTP MESSAGES
  const [otpError, setOtpError] = useState(""); // <-- ADDED FOR OTP ERRORS

  const handleSendOtp = async () => {
    if (!email) {
      setOtpError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setOtpMessage("");
    setOtpError("");
    try {
      const response = await fetch('/api/auth/register/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to send OTP.");

      setOtpMessage(result.message);
      setOtpSent(true);
    } catch (error) {
      console.error("Send OTP error:", error);
      setOtpError(error.message || "An error occurred while sending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setOtpError("Please enter the OTP.");
      return;
    }
    setIsLoading(true);
    setOtpMessage("");
    setOtpError("");
    try {
      const response = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "OTP verification failed.");

      setOtpMessage(result.message);
      setOtpVerified(true);
      setOtpSent(false);
    } catch (error) {
      console.error("Verify OTP error:", error);
      setOtpError(error.message || "An error occurred during OTP verification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!otpVerified) {
      alert("Please verify your email address with OTP first.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (!email || !password || !fullName || !department || !year || !semester || !registerNumber) {
      alert("Please fill out all required fields.");
      return;
    }
    setIsLoading(true);

    try {
      const finalInterests = selectedInterests.filter(interest => interest !== 'Other');
      if (selectedInterests.includes('Other') && otherInterest) {
        finalInterests.push(otherInterest);
      }

      const userData = {
        fullName,
        email,
        dob,
        phone,
        address,
        department,
        year,
        semester,
        registerNumber,
        interests: finalInterests,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userData }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Registration failed.');

      alert('Registration successful! Your account is pending admin approval.');
      router.push('/register/login');
    } catch (error) {
      console.error("Error during registration:", error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearSemChange = (value) => {
    if (value) {
      const [yearVal, semVal] = value.split('-');
      setYear(yearVal);
      setSemester(semVal);
    }
  };

  const isOtherInterestSelected = selectedInterests.includes('Other');

  return (
  <main className="blueprint-background flex items-center justify-center min-h-screen bg-gray-100 dark:bg-[#000408] px-4 py-8 sm:px-6 lg:px-8">
    <div>
      <Card className="w-full max-w-full lg:min-w-[800px] lg:max-w-[900px] mx-auto px-4 shadow-lg rounded-2xl"> {/* <-- CHANGED LINE */}
        <CardHeader>
          <CardTitle className='text-xl sm:text-2xl'>IEDC Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"> {/* <-- CHANGED LINE */}

            {/* --- LEFT COLUMN --- */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input id="fullname" placeholder="Mitnic Hiter" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex space-x-2">
                  <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={otpSent || otpVerified} />
                  {!otpSent && !otpVerified && (
                    <Button type="button" onClick={handleSendOtp} disabled={isLoading || !email}>Send OTP</Button>
                  )}
                  {otpSent && !otpVerified && (
                    <Button type="button" variant="outline" onClick={() => { setOtpSent(false); setOtp(""); setOtpMessage(""); setOtpError(""); setEmail(email); /* Keep email for resend if needed, or clear it: setEmail(""); */ }} disabled={isLoading}>Change Email</Button>
                  )}
                </div>
                {otpMessage && <p className="text-sm text-green-600">{otpMessage}</p>}
                {otpError && <p className="text-sm text-red-600">{otpError}</p>}
              </div>

              {otpSent && !otpVerified && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <div className="flex space-x-2">
                    <Input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    <Button type="button" onClick={handleVerifyOtp} disabled={isLoading || !otp}>Verify OTP</Button>
                  </div>
                </div>
              )}

              {otpVerified && <p className="text-sm font-medium text-green-600">Email Verified Successfully!</p>}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
            </div>

            {/* --- RIGHT COLUMN --- */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main St, City" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select onValueChange={setDepartment}>
                  <SelectTrigger id="department"><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                    <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                    <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                    <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                    <SelectItem value="Automobile Engineering">Automobile Engineering</SelectItem>
                    <SelectItem value="Electronics and Communications">Electronics & Communications</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year-sem">Year & Semester</Label>
                <Select onValueChange={handleYearSemChange}>
                  <SelectTrigger id="year-sem"><SelectValue placeholder="Select Year & Semester" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-1">1st Year - 1st Semester</SelectItem>
                    <SelectItem value="1-2">1st Year - 2nd Semester</SelectItem>
                    <SelectItem value="2-3">2nd Year - 3rd Semester</SelectItem>
                    <SelectItem value="2-4">2nd Year - 4th Semester</SelectItem>
                    <SelectItem value="3-5">3rd Year - 5th Semester</SelectItem>
                    <SelectItem value="3-6">3rd Year - 6th Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registerNumber">Register Number</Label>
                <Input id="registerNumber" placeholder="Enter Register Number" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interests">Interests</Label>
                <MultiSelect
                  options={interestOptions}
                  selected={selectedInterests}
                  onChange={setSelectedInterests}
                  className="w-full"
                />
              </div>
            </div>

            {/* --- FULL WIDTH ROW FOR OTHER INTEREST --- */}
            <div className="md:col-span-2 space-y-2"> {/* <-- MODIFIED LINE to span 2 columns on medium screens and up */}
              <Label htmlFor="other-interest">If Other, please specify</Label>
              <Input
                id="other-interest"
                placeholder="e.g., AI/ML"
                value={otherInterest}
                onChange={(e) => setOtherInterest(e.target.value)}
                disabled={!isOtherInterestSelected}
                className={!isOtherInterestSelected ? "bg-gray-100 dark:bg-gray-800" : ""}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-orange-700" onClick={handleRegister} disabled={isLoading || !otpVerified}>
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/register/login" className="underline font-semibold">
          Sign in
        </Link>
      </div>
    </div>
  </main>
);
}