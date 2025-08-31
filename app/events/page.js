"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function EventsListPage() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const functions = getFunctions();
                const getPublicEvents = httpsCallable(functions, 'getPublicEvents');
                const result = await getPublicEvents();
                setEvents(result.data);
            } catch (err) {
                console.error("Error fetching public events:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Upcoming Events
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Join us for our upcoming workshops, talks, and competitions.
                </p>
            </div>

            {isLoading && (
                <div className="text-center">Loading events...</div>
            )}

            {error && (
                <div className="text-center text-red-500">Error: {error}</div>
            )}

            {!isLoading && !error && events.length > 0 && (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                        <Card key={event.id} className="flex flex-col">
                            <CardHeader>
                                {event.bannerUrl && (
                                    <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
                                        <Image
                                            src={event.bannerUrl}
                                            alt={`${event.name} banner`}
                                            layout="fill"
                                            objectFit="cover"
                                        />
                                    </div>
                                )}
                                <CardTitle className="pt-4">{event.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {event.description}
                                </p>
                                <p className="text-sm font-semibold mt-4">
                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </CardContent>
                            <div className="p-6 pt-0">
                                <Link href={`/events/${event.id}/register`} passHref>
                                    <Button className="w-full">
                                        View & Register <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && !error && events.length === 0 && (
                <div className="text-center text-muted-foreground mt-16">
                    <p>No upcoming events scheduled at the moment.</p>
                    <p>Please check back later!</p>
                </div>
            )}
        </div>
    );
}
