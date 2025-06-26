"use server";

import { z } from "zod";
import { db, storage } from "@/lib/firebase"; // Assuming client-side SDKs are configured
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { nanoid } from "nanoid";

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
  eventDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid date format."),
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
    if (bannerImage) {
      const slugifiedEventName = slugify(eventName);
      const fileExtension = bannerImage.name.split(".").pop();
      const uniqueFileName = `${slugifiedEventName}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `event_banners/${uniqueFileName}`);

      await uploadBytes(storageRef, bannerImage);
      bannerUrl = await getDownloadURL(storageRef);
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
