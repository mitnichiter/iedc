"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createEvent } from "../actions"; // Import the server action
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";

const initialState = {
  message: null,
  errors: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full md:w-auto" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        "Create Event"
      )}
    </Button>
  );
}

export default function CreateEventPage() {
  const router = useRouter();
  const [state, formAction] = useFormState(createEvent, initialState);

  const [date, setDate] = useState(null); // Keep client-side state for DatePicker
  const [bannerFile, setBannerFile] = useState(null); // For file input
  const [bannerPreview, setBannerPreview] = useState(null); // For image preview

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file); // Store the file object
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setBannerFile(null);
      setBannerPreview(null);
    }
  };

  // Effect to handle server action response for toasts and redirection
  useEffect(() => {
    if (state.success === true) {
      toast.success(state.message || "Event created successfully!");
      router.push("/admin/events");
    } else if (state.success === false && state.message) {
      toast.error(state.message);
      // Optionally, you could display state.errors in the form
    }
  }, [state, router]);


  // Client-side validation or immediate feedback can still be useful
  // For instance, for the date picker or file preview.
  // The main form submission will be handled by formAction.

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent default form submission

    // Create FormData and append additional client-managed fields
    const formData = new FormData(event.target);
    if (date) {
      formData.append("eventDate", date.toISOString());
    }
    // The file input named "bannerImage" will automatically be included by FormData
    // if a file is selected. No need to manually append bannerFile if the input has name="bannerImage".

    formAction(formData); // Dispatch the server action
  };


  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a New Event</CardTitle>
        <CardDescription>Fill in the details below to schedule a new event.</CardDescription>
      </CardHeader>
      {/* Bind the form to the server action */}
      <form onSubmit={handleSubmit}> {/* Changed from action={formAction} to onSubmit to handle date and file */}
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input id="eventName" name="eventName" type="text" placeholder="e.g., Annual Tech Summit" required />
            {state?.errors?.eventName && <p className="text-sm text-red-500">{state.errors.eventName.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventBanner">Event Banner/Poster</Label>
            {/* Ensure the input has a name attribute for FormData to pick it up */}
            <Input id="eventBanner" name="bannerImage" type="file" accept="image/*" onChange={handleBannerChange} />
            <p className="text-sm text-muted-foreground">Recommended aspect ratio: 16:9. Max file size: 2MB.</p>
            {bannerPreview && (
              <div className="mt-2">
                <img src={bannerPreview} alt="Banner preview" className="rounded-md max-h-48 object-contain" />
              </div>
            )}
            {state?.errors?.bannerImage && <p className="text-sm text-red-500">{state.errors.bannerImage.join(', ')}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date</Label>
              {/* Date is handled by client state and manually added to FormData */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {state?.errors?.eventDate && <p className="text-sm text-red-500">{state.errors.eventDate.join(', ')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventTime">Time</Label>
              <Input id="eventTime" name="eventTime" type="time" required />
              {state?.errors?.eventTime && <p className="text-sm text-red-500">{state.errors.eventTime.join(', ')}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventVenue">Venue</Label>
            <Input id="eventVenue" name="eventVenue" type="text" placeholder="e.g., Main Auditorium" required />
            {state?.errors?.eventVenue && <p className="text-sm text-red-500">{state.errors.eventVenue.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationFee">Registration Fee (INR)</Label>
            <Input id="registrationFee" name="registrationFee" type="number" placeholder="0" min="0" defaultValue="0" required />
            <p className="text-sm text-muted-foreground">Enter 0 for a free event.</p>
            {state?.errors?.registrationFee && <p className="text-sm text-red-500">{state.errors.registrationFee.join(', ')}</p>}
          </div>

        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
      {/* Display general message from server action if any */}
      {/* {state?.message && !state.success && <p className="mt-4 text-sm text-red-500 text-center">{state.message}</p>} */}
    </Card>
  );
}
