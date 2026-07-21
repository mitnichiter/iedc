"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select"; 

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
  { value: 'Other', label: 'Other' },
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
  const [registerNumber, setRegisterNumber] = useState("");
  
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [otherInterest, setOtherInterest] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !fullName || !department || !year || !semester || !registerNumber) {
      alert("Please fill out all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const finalInterests = selectedInterests.filter(interest => interest !== 'Other');
      if (selectedInterests.includes('Other') && otherInterest) {
        finalInterests.push(otherInterest);
      }

      // 1. Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
             full_name: fullName,
          }
        }
      });

      if (authError) throw authError;

      // 2. Insert Profile
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            dob: dob,
            phone: phone,
            register_number: registerNumber,
            department: department,
            year: year,
            semester: semester,
            college: "Carmel Polytechnic College, Alappuzha",
            interests: finalInterests,
            role: 'student'
          });

        if (profileError) {
             console.error("Profile creation error:", profileError);
             // If already exists (e.g. from invite), update?
             // For now just alert.
             if (profileError.code === '23505') { // Unique violation
                  alert("Profile already exists. Please login.");
                  router.push('/register/login');
                  return;
             }
             alert("Account created, but profile failed: " + profileError.message);
        } else {
             alert('Registration successful! Please check your email to confirm your account.');
             router.push('/register/login');
        }
      }

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
  <main className="flex items-center justify-center min-h-screen bg-background p-4 py-8">
    <div className="w-full max-w-full lg:max-w-[900px]">
      <Card className="shadow-lg rounded-2xl w-full"> 
        <CardHeader>
          <CardTitle className='text-xl sm:text-2xl'>IEDC Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

            {/* --- LEFT COLUMN --- */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input id="fullname" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

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
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="other-interest">If Other, please specify</Label>
              <Input
                id="other-interest"
                placeholder="e.g., AI/ML"
                value={otherInterest}
                onChange={(e) => setOtherInterest(e.target.value)}
                disabled={!isOtherInterestSelected}
                className={!isOtherInterestSelected ? "bg-muted" : ""}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full bg-orange-700 hover:bg-orange-800" onClick={handleRegister} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/register/login" className="underline font-semibold hover:text-primary">
          Sign in
        </Link>
      </div>
    </div>
  </main>
);
}