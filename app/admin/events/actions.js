"use server";

import { z } from "zod";
import { db, storage } from "@/lib/firebase"; // Assuming client-side SDKs are configured
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { nanoid } from "nanoid";

import { isBefore, startOfDay, addDays } from 'date-fns'; // Import date-fns functions

// Slugify function (simple version)
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

// Zod schema for event validation
const eventSchema = z.object({
  eventName: z.string().min(3, "Event name must be at least 3 characters long."),
  eventDate: z.string()
    .refine((date) => !isNaN(new Date(date).getTime()), "Invalid date format.")
    .refine((date) => {
      const eventD = startOfDay(new Date(date));
      const tomorrow = startOfDay(addDays(new Date(), 1));
      return !isBefore(eventD, tomorrow);
    }, "Event date must be at least 1 day in the future."),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
  eventVenue: z.string().min(3, "Venue must be at least 3 characters long."),
  registrationFee: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0, "Registration fee cannot be negative.")
  ),
  bannerImage: z
    .instanceof(File, { message: "Banner image is required." })
    .refine((file) => file.size <= 2 * 1024 * 1024, `File size should be less than 2MB.`) // Max 2MB
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type),
      "Only .jpg, .jpeg, .png, .webp and .gif formats are supported."
    ),
    // .optional(), // Making it required
});


export async function createEvent(prevState, formData) {
  const rawFormData = {
    eventName: formData.get("eventName"),
    // eventDate is already a string from formData.append("eventDate", date.toISOString());
    eventDate: formData.get("eventDate"),
    eventTime: formData.get("eventTime"),
    eventVenue: formData.get("eventVenue"),
    registrationFee: formData.get("registrationFee"),
    bannerImage: formData.get("bannerImage"), // This will be a File object
  };

  const validatedFields = eventSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    // console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    // Simplified error message for now
    const errors = validatedFields.error.flatten().fieldErrors;
    let errorMessages = [];
    for (const key in errors) {
        if(errors[key]) errorMessages.push(`${key}: ${errors[key].join(', ')}`);
    }
    return {
      success: false,
      message: `Validation failed: ${errorMessages.join('; ')}` || "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { eventName, eventDate, eventTime, eventVenue, registrationFee, bannerImage } = validatedFields.data;

  try {
    let bannerUrl = "";
    if (bannerImage && bannerImage instanceof File) { // Ensure bannerImage is a File
      console.log("Attempting to upload banner image. Details:");
      console.log(" - Name:", bannerImage.name);
      console.log(" - Size:", bannerImage.size);
      console.log(" - Type:", bannerImage.type);

      const slugifiedEventName = slugify(eventName);
      const fileExtension = bannerImage.name.split(".").pop();
      const uniqueFileName = `${slugifiedEventName}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `event_banners/${uniqueFileName}`);

      await uploadBytes(storageRef, bannerImage);
      bannerUrl = await getDownloadURL(storageRef);
      console.log("Banner uploaded successfully. URL:", bannerUrl);
    } else if (bannerImage) {
      // This case might occur if something other than a File object is passed.
      console.warn("bannerImage was present but not a File object. Type:", typeof bannerImage);
      // Depending on strictness, you might want to return an error here.
      // For now, we'll proceed without a banner if it's not a valid file.
    }


    const eventSlugBase = slugify(eventName);
    const uniqueEventSlug = `${eventSlugBase}-${nanoid(6)}`;

    const newEvent = {
      name: eventName,
      date: Timestamp.fromDate(new Date(eventDate)),
      time: eventTime,
      venue: eventVenue,
      registrationFee: registrationFee,
      bannerUrl: bannerUrl,
      slug: uniqueEventSlug,
      status: "upcoming", // Default status
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, "events"), newEvent);

    return {
      success: true,
      message: "Event created successfully!",
    };
  } catch (error) {
    console.error("Error creating event:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred while creating the event.",
    };
  }
}
