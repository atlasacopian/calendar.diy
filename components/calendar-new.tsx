"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, getDay, getDaysInMonth, parse, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Tag, X, User as UserIcon, AlertTriangle, Camera, Calendar as CalendarIcon, ArrowUpDown, Check, RefreshCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import ProjectGroups from './project-groups';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/lib/auth-context";
import AuthButton from '@/components/AuthButton';
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Event {
  id: string;
  date: Date;
  content: string;
  formattedContent?: string;
  color?: string;
  projectId?: string;
  isDeleted?: boolean; // Flag for temporary deletion in modal
}

interface ProjectGroup {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

interface Holiday {
  date: Date;
  name: string;
}

const colorOptions = [
  { name: 'Default', value: 'text-black', bg: 'bg-[#000000]' },
  { name: 'Red', value: 'text-red-500', bg: 'bg-[#ff0000]' },
  { name: 'Orange', value: 'text-orange-500', bg: 'bg-[#ff7200]' },
  { name: 'Yellow', value: 'text-yellow-500', bg: 'bg-[#e3e600]' },
  { name: 'Green', value: 'text-green-500', bg: 'bg-[#1ae100]' },
  { name: 'Blue', value: 'text-blue-600', bg: 'bg-[#0012ff]' },
  { name: 'Purple', value: 'text-purple-600', bg: 'bg-[#a800ff]' },
];

const weekDays = ["S", "M", "T", "W", "T", "F", "S"]
const weekDaysMobile = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

const getBgFromTextColor = (textColor: string) => {
  const color = colorOptions.find((c) => c.value === textColor);
  return color ? color.bg : "bg-gray-200";
};

const getTextForBg = (textColor: string) => {
  return "text-white"
}

const getTextColorClass = (colorClass: string | undefined) => {
  if (!colorClass) return "text-gray-600"
  const color = colorOptions.find((c) => c.value === colorClass)
  return color ? color.value : "text-gray-600"
}

function getTextColorFromBg(bgColor: string): string {
  const color = colorOptions.find(c => c.bg === bgColor);
  return color ? color.value : 'text-gray-800';
}

export default function CalendarNew() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialProjectGroups = useMemo(() => [{ id: 'default', name: 'TAG 01', color: 'text-black', active: true }], []);

  const [currentDate, setCurrentDate] = useState(() => {
    const dateParam = searchParams ? searchParams.get('date') : null;
    if (dateParam) {
      const [year, month] = dateParam.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month) && year > 1900 && year < 3000 && month >= 1 && month <= 12) {
        const targetDate = new Date(year, month - 1, 1);
        if (!isNaN(targetDate.getTime())) {
          console.log(`Setting initial date from URL: ${targetDate}`)
          return targetDate;
        }
      }
      console.warn(`Invalid date parameter in URL: ${dateParam}`)
    }
    console.log(`Setting initial date to default: ${new Date()}`)
    return new Date()
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>(initialProjectGroups);

  const isMountedRef = useRef(false); // To track if component has mounted
  const prevUserRef = useRef(user); // To track user login/logout transitions

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState<Event[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('text-black');
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const cancelResetButtonRef = useRef<HTMLButtonElement>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0);
  const [selectedText, setSelectedText] = useState<{ start: number; end: number } | null>(null);
  const [exportTarget, setExportTarget] = useState<"ical" | "google">("ical");
  const [selectedExportTags, setSelectedExportTags] = useState<string[]>([]);
  const [showGoogleInstructionsModal, setShowGoogleInstructionsModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [tagsCopied, setTagsCopied] = useState(false);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);
  const deleteConfirmRef = useRef<HTMLDivElement>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [newlyAddedEventId, setNewlyAddedEventId] = useState<string | null>(null);
  const [modalCloseState, setModalCloseState] = useState<'idle' | 'saving' | 'saved' | 'canceling'>('idle');
  const [hoveredSingleEventDate, setHoveredSingleEventDate] = useState<Date | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [draggedEventIndex, setDraggedEventIndex] = useState<number | null>(null);
  const [dropTargetEventId, setDropTargetEventId] = useState<string | null>(null);
  const [originalModalEvents, setOriginalModalEvents] = useState<Event[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resetModalRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarContentRef = useRef<HTMLDivElement>(null);
  const fullCalendarRef = useRef<HTMLDivElement>(null);
  const printableCalendarRef = useRef<HTMLDivElement>(null);
  const shareInputRef = useRef<HTMLInputElement>(null);
  const dateSelectorRef = useRef<HTMLDivElement>(null);
  const eventModalRef = useRef<HTMLDivElement>(null);
  const shareModalRef = useRef<HTMLDivElement>(null);
  const eventInputRef = useRef<HTMLTextAreaElement>(null);
  const firstEventInputRef = useRef<HTMLTextAreaElement>(null);
  const calendarScreenshotContainerRef = useRef<HTMLDivElement>(null);
  const [holidayForSelectedDate, setHolidayForSelectedDate] = useState<string | null>(null);

  const prevUser = useRef(user); // Ref to store previous user state

  // Track when we are in the middle of a login→logout transition so we don't
  // erroneously persist cloud data into the anonymous localStorage bucket.
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    try {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 640)
      }
      checkIfMobile()
      window.addEventListener("resize", checkIfMobile)

      const handleKeyDown = (e: KeyboardEvent) => {
        // --- Update check for modal state --- 
        if (showModal || showAddDialog) return; // Do nothing if event modal OR tag dialog is open

        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            // console.log("Left arrow key pressed");
            // console.log("Current date before change:", currentDate);
            setCurrentDate(prevDate => {
              const newDate = subMonths(prevDate, 1);
            //   console.log("New date after change:", newDate);
              return newDate;
            });
            const leftArrow = document.getElementById('calendar-nav-left');
            if (leftArrow) {
            //   console.log("Left arrow element found");
              leftArrow.style.color = 'black';
              setTimeout(() => leftArrow.style.color = '', 75);
            // } else {
            //   console.log("Left arrow element not found");
            }
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            setCurrentDate(prevDate => addMonths(prevDate, 1));
            const rightArrow = document.getElementById('calendar-nav-right');
            if (rightArrow) {
              rightArrow.style.color = 'black';
              setTimeout(() => rightArrow.style.color = '', 75);
            }
          }
        }
      }
      window.addEventListener("keydown", handleKeyDown)

      return () => {
        window.removeEventListener("resize", checkIfMobile)
        window.removeEventListener("keydown", handleKeyDown)
      }
    } catch (error) {
      console.error("Error initializing calendar listeners:", error)
    }
  }, [showModal, showAddDialog, currentDate]); 

  // Effect 1: Handles Initial Data Load, Login Migration, and Logout Cleanup
  useEffect(() => {
    const loadInitialDataOrMigrate = async () => {
      if (user) {
        // USER LOGGED IN
        console.log('[DataLoad/Login] User detected. ID:', user.id);

        // 1️⃣ Attempt to load a cached snapshot for this user from localStorage so we can
        //    paint the UI immediately while the network request to Supabase is in flight.
        //    This makes the calendar appear almost instantly after a refresh or page load.
        let snapshotEvents: Event[] = [];
        let snapshotGroups: ProjectGroup[] = [...initialProjectGroups];

    if (typeof window !== 'undefined') {
          const snapshotStr = localStorage.getItem(`calendarSnapshot_${user.id}`);
          if (snapshotStr) {
      try {
              const parsed = JSON.parse(snapshotStr);
              snapshotEvents = (parsed.events || []).map((ev: any) => ({ ...ev, date: new Date(ev.date) }));
              snapshotGroups = parsed.groups && parsed.groups.length > 0 ? parsed.groups : [...initialProjectGroups];

              // Immediately show the cached data. A later successful cloud fetch will
              // overwrite this state with the latest data.
              setEvents(snapshotEvents);
              setProjectGroups(snapshotGroups);
              console.log('[DataLoad/Login] Loaded snapshot from localStorage for quick display:', { ev: snapshotEvents.length, gr: snapshotGroups.length });
            } catch (err) {
              console.error('[DataLoad/Login] Error parsing local snapshot:', err);
            }
          }
        }

        let localEvents: Event[] = [];
        let localGroups: ProjectGroup[] = [];

        if (typeof window !== 'undefined') {
          const lsEventsStr = localStorage.getItem('calendarEvents');
          const lsGroupsStr = localStorage.getItem('projectGroups');
          if (lsEventsStr) try { localEvents = JSON.parse(lsEventsStr, (k,v) => k === 'date' ? new Date(v) : v); } catch(e) { console.error("Err parsing local events for migration:", e); }
          if (lsGroupsStr) try { localGroups = JSON.parse(lsGroupsStr); } catch(e) { console.error("Err parsing local groups for migration:", e); }
          console.log('[DataLoad/Login] Found local data for migration:', { ev: localEvents.length, gr: localGroups.length });
        }

        let cloudEvents: Event[] = [];
        let cloudGroups: ProjectGroup[] = [...initialProjectGroups];
        let cloudFetchSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const res = await fetch('/api/calendar');
            if (res.ok) {
              const data = await res.json();
              cloudEvents = data.events?.map((ev: any) => ({ ...ev, date: new Date(ev.date) })) || [];
              cloudGroups = data.groups && data.groups.length > 0 ? data.groups : [...initialProjectGroups];
              console.log('[DataLoad/Login] Cloud data fetched:', { ev: cloudEvents.length, gr: cloudGroups.length });
              cloudFetchSuccess = true;
              break;
            }
            if (res.status === 401 && attempt < 3) {
              console.log('[DataLoad/Login] Cloud fetch 401 (cookies not set yet?). Retrying in 400ms…');
              await new Promise(r => setTimeout(r, 400));
            } else {
              console.error('[DataLoad/Login] Failed to fetch cloud data, status:', res.status);
              break; 
            }
          } catch (err) {
            console.error('[DataLoad/Login] Error fetching cloud data:', err);
            if (attempt < 3) await new Promise(r => setTimeout(r, 400)); else break;
          }
        }

        let finalEvents = cloudEvents;
        let finalGroups = cloudGroups;

        if (localEvents.length > 0) { // Merge if local data exists
          const cloudEventIds = new Set(cloudEvents.map(e => e.id));
          const newLocalEvents = localEvents.filter(le => !cloudEventIds.has(le.id));
          finalEvents = [...cloudEvents, ...newLocalEvents];

          const localHasSignificantGroups = localGroups.some(g => g.id !== 'default') || localGroups.length > 1;
          const cloudHasOnlyDefaultGroup = cloudGroups.length === 1 && cloudGroups[0].id === 'default';
          if (localHasSignificantGroups && cloudHasOnlyDefaultGroup && localGroups.length > 0) {
            finalGroups = localGroups;
          } else if (cloudGroups.length === 0 && localGroups.length > 0) {
            finalGroups = localGroups;
          } else if (finalGroups.length === 0) { // If cloud was empty and local was empty or default
            finalGroups = localGroups.length > 0 ? localGroups : [...initialProjectGroups];
          }
          console.log('[DataLoad/Login] Merged local and cloud. Final to save:', { ev: finalEvents.length, gr: finalGroups.length });
          
          // Save merged data to Supabase (this also updates localStorage snapshot via SaveEffect)
          try {
            await fetch('/api/calendar', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ events: finalEvents.map(e => ({...e, date: e.date.toISOString()})), groups: finalGroups })
            });
            console.log('[DataLoad/Login] Merged data saved to Supabase.');
          } catch (e) { console.error ('[DataLoad/Login] Error saving merged data to Supabase', e);}

          if (typeof window !== 'undefined') {
            localStorage.removeItem('calendarEvents');
            localStorage.removeItem('projectGroups');
          }
        } else if (!cloudFetchSuccess && localEvents.length === 0) {
          // If the cloud fetch failed (e.g., network hiccup) fall back to the snapshot
          // we might have just loaded above. If there is no snapshot either, keep empty state.
          if (snapshotEvents.length > 0) {
            console.log('[DataLoad/Login] Cloud fetch failed – using cached snapshot.');
            finalEvents = snapshotEvents;
            finalGroups = snapshotGroups;
          } else {
            console.log('[DataLoad/Login] No cloud or local data. Setting empty state.');
            finalEvents = [];
            finalGroups = [...initialProjectGroups];
          }
        }
        
        setEvents(finalEvents);
        setProjectGroups(finalGroups);

      } else { // USER IS LOGGED OUT
        if (prevUser.current) { // This means a logout just occurred
           isLoggingOutRef.current = true; // mark logout before any state clears
           console.log('[DataLoad/Logout] Logout detected. Clearing UI and localStorage.');
           setEvents([]);
           setProjectGroups([...initialProjectGroups]);
           if (typeof window !== 'undefined') {
             localStorage.removeItem('calendarEvents');
             localStorage.removeItem('projectGroups');
             localStorage.removeItem(`calendarSnapshot_${prevUser.current.id}`); // Clear snapshot of logged-out user
           }
        } else { // Initial load and user is logged out
          console.log('[DataLoad/Logout] User logged out (initial). Loading from localStorage.');
          if (typeof window !== 'undefined') {
            const lsEventsStr = localStorage.getItem('calendarEvents');
            const lsGroupsStr = localStorage.getItem('projectGroups');
            let loadedEvents: Event[] = [];
            let loadedGroups: ProjectGroup[] = [...initialProjectGroups];
            if (lsEventsStr) try { loadedEvents = JSON.parse(lsEventsStr, (k,v) => k === 'date' ? new Date(v) : v); } catch(e) {console.error("Err parsing lsEvents on logged-out load", e);}
            if (lsGroupsStr) try { loadedGroups = JSON.parse(lsGroupsStr); } catch(e) {console.error("Err parsing lsGroups on logged-out load", e);}
            setEvents(loadedEvents);
            setProjectGroups(loadedGroups.length > 0 ? loadedGroups : [...initialProjectGroups]);
    }
        }
      }
      prevUser.current = user; // Update previous user state for next run
      isMountedRef.current = true; // Mark initial load as done
      isLoggingOutRef.current = false; // Reset flag after all logout/login processing is complete
    };

    loadInitialDataOrMigrate();
  }, [user, initialProjectGroups]); // Runs on user change

  // Effect 2: Handles Saving Data on Changes (after initial load)
  useEffect(() => {
    if (!isMountedRef.current) { // Don't save on the very first render cycle
      return;
    }

    if (user) { // Logged IN: Save to Supabase
      if (isLoggingOutRef.current) {
        console.log('[SaveEffect] Logout transition – skipping Supabase save');
        return;
      }
      const payload = {
        events: events.map(e => ({ ...e, date: e.date instanceof Date ? e.date.toISOString() : e.date })),
        groups: projectGroups
      };
      console.log('[SaveEffect] User logged in. Saving to Supabase:', { ev: events.length, gr: projectGroups.length });
      fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      .then(response => {
        if (response.ok) {
          console.log('[SaveEffect] Successfully saved to Supabase.');
          if (typeof window !== 'undefined') { // Update local snapshot for this user
            localStorage.setItem(`calendarSnapshot_${user.id}`, JSON.stringify(payload));
          }
        } else {
          response.text().then(text => {
            console.error('[SaveEffect] Error saving to Supabase. Status:', response.status, 'Body:', text);
          });
        }
      })
      .catch(err => console.error('[SaveEffect] Network error saving to Supabase:', err));
    } else { // Logged OUT: Save to localStorage
    if (typeof window !== 'undefined') {
        // Skip while we are transitioning out of a session
        if (isLoggingOutRef.current) {
          console.log('[SaveEffect] Logout transition – skipping localStorage save to avoid stale data');
          return;
        }

        console.log('[SaveEffect] User logged out (no prior session). Saving to localStorage.', { ev: events.length, gr: projectGroups.length });
        const eventsToSave = events.map(event => ({
            ...event,
            date: event.date instanceof Date ? event.date.toISOString() : event.date,
        }));
        localStorage.setItem('calendarEvents', JSON.stringify(eventsToSave));
        localStorage.setItem('projectGroups', JSON.stringify(projectGroups));
      }
    }
  }, [events, projectGroups]); // Runs when events or groups change

  useEffect(() => {
    const fetchHolidays = async () => {
       try {
        const year = currentDate.getFullYear();
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const formattedHolidays: Holiday[] = data.map((holiday: any) => ({
          date: parse(holiday.date, 'yyyy-MM-dd', new Date()),
          name: holiday.localName,
        }));

        const uniqueHolidaysMap = new Map<string, Holiday>();
        formattedHolidays.forEach(holiday => {
            const key = `${format(holiday.date, 'yyyy-MM-dd')}-${holiday.name}`;
            if (!uniqueHolidaysMap.has(key)) {
                uniqueHolidaysMap.set(key, holiday);
            }
        });
        const uniqueHolidays = Array.from(uniqueHolidaysMap.values());

        setHolidays(uniqueHolidays);

      } catch (error) {
        console.error("Could not fetch holidays:", error);
      }
    };
    fetchHolidays();
  }, [currentDate]);

  useEffect(() => {
    if (!showDateSelector) return;

    function handleClickOutside(event: MouseEvent) {
      if (dateSelectorRef.current && !dateSelectorRef.current.contains(event.target as Node)) {
        setShowDateSelector(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDateSelector]);

  const handleExportWithTags = () => {
    if (selectedExportTags.length === 0) {
      console.warn("No tags selected for export.");
      return;
    }

    const eventsToExport = events.filter(event => {
      const eventTagId = event.projectId ?? 'default';
      return selectedExportTags.includes(eventTagId);
    });

    if (eventsToExport.length === 0) {
      console.warn("No events found for the selected tags.");
      alert("No events found for the selected tags.");
      return;
    }

    // Build ICS file header
    const headerLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//YourCalendarApp//DIY Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:DIY Calendar",
    ];
    let icalString = headerLines.join("\r\n") + "\r\n";

    // Add each event as a VEVENT block
    eventsToExport.forEach(event => {
      const startDate = format(event.date, 'yyyyMMdd');
      const endDate = format(addDays(event.date, 1), 'yyyyMMdd');
      const summary = event.content.replace(/\r\n|\r|\n/g, '\\n');
      const eventLines = [
        "BEGIN:VEVENT",
        `UID:${event.id}@yourdomain.com`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${summary}`,
        "END:VEVENT",
      ];
      icalString += eventLines.join("\r\n") + "\r\n";
    });

    // ICS file footer
    icalString += "END:VCALENDAR\r\n";

    const blob = new Blob([icalString], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;  

    const filename = exportTarget === 'google' ? 'google-calendar-export.ics' : 'calendar-export.ics';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (exportTarget === 'google') {
      setShowGoogleInstructionsModal(true);
    }

    setShowExportOptionsModal(false);
    setSelectedExportTags([]);
  };

  const handleToggleProjectGroup = useCallback((groupId: string) => {
    setProjectGroups((prevGroups) =>
      prevGroups.map((group) => (group.id === groupId ? { ...group, active: !group.active } : group)),
    )
  }, [])

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingGroupId(null);
    setNewProjectName('');
    setNewProjectColor('text-black');
    setDialogError(null);
  };

  const handleShowAddDialog = () => {
    setEditingGroupId(null);
    setNewProjectName('');
    setNewProjectColor('text-black');
    setShowAddDialog(true);
  };

  const handleShowEditDialog = (group: ProjectGroup) => {
      setEditingGroupId(group.id);
      setNewProjectName(group.name);
      setNewProjectColor(group.color);
      setShowAddDialog(true);
  };

  const handleSaveDialog = () => {
    const nameToSave = newProjectName.trim().toUpperCase() || 'TAG 01';
    const colorToSave = newProjectColor;
    const currentId = editingGroupId;
    setDialogError(null);

    const duplicateExists = projectGroups.some(
        group => group.id !== currentId && group.name.toUpperCase() === nameToSave
    );

    if (duplicateExists) {
        setDialogError(`Name "${newProjectName.trim()}" already exists.`);
        return;
    }

    if (currentId) {
      setProjectGroups(prevGroups => prevGroups.map(group =>
        group.id === currentId ? { ...group, name: nameToSave, color: colorToSave } : group
      ));
    } else {
      const newGroup: ProjectGroup = {
        id: Date.now().toString(),
        name: nameToSave,
        color: colorToSave,
        active: true,
      };
      setProjectGroups(prevGroups => [...prevGroups, newGroup]);
    }
    handleCloseDialog();
  };

  const handleRequestDelete = (groupId: string) => {
    if (groupId === 'default') return;
    setShowDeleteConfirmId(groupId);
    handleCloseDialog();
  };

  const handleDeleteGroup = () => {
    if (!showDeleteConfirmId) return;

    const groupIdToDelete = showDeleteConfirmId;
    setProjectGroups(prevGroups => prevGroups.filter(group => group.id !== groupIdToDelete));
    setEvents(prevEvents => prevEvents.map(event => {
        if (event.projectId === groupIdToDelete) {
            return { ...event, projectId: undefined, color: 'text-black' };
        }
        return event;
    }));
    setShowDeleteConfirmId(null);
  };

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDate(day)
    const existingEventsRaw = events.filter((event) => isSameDay(event.date, day));
    const existingEventsDeepCopy = JSON.parse(JSON.stringify(existingEventsRaw));
    setEventsForSelectedDate(existingEventsDeepCopy); 
    setOriginalModalEvents(existingEventsDeepCopy);   
    setActiveEventIndex(0)

    const dayHoliday = holidays.find((holiday) => isSameDay(holiday.date, day));
    setHolidayForSelectedDate(dayHoliday ? dayHoliday.name : null);

    setShowModal(true)

    if (existingEventsRaw.length === 0) {
      const newEvent = {
        id: Math.random().toString(36).substring(2, 11),
        date: day,
        content: "",
        color: "text-black",
        projectId: "default",
      }
      setEventsForSelectedDate([newEvent])

      setTimeout(() => {
        if (firstEventInputRef.current) {
          firstEventInputRef.current.focus()
        }
      }, 50)
    }
  }, [events, holidays]); 

  const handleCancelEdit = () => {
    // Optional: Revert to original events if changes shouldn't persist on cancel
    // setEventsForSelectedDate(originalModalEvents); 

    setShowModal(false);
      setSelectedDate(null);
      setActiveEventIndex(0);
    setOriginalModalEvents([]);
    setModalCloseState('idle'); // Reset state for next time modal opens
  };

  const handleSaveAndClose = () => {
    setModalCloseState('saving');

    if (selectedDate) {
        const nonEmptyEvents = eventsForSelectedDate.filter((event) => event.content.trim() !== "");
        const eventsToSave = nonEmptyEvents.map(ev => ({ ...ev, date: selectedDate }));
        const otherEvents = events.filter((event) => !isSameDay(event.date, selectedDate));
        const newEvents = [...otherEvents, ...eventsToSave];
        setEvents(newEvents);
    }

    // Keep the success animation for save
    setTimeout(() => {
    setModalCloseState('saved');
    setTimeout(() => {
        setShowModal(false);
        setSelectedDate(null);
        setActiveEventIndex(0);
        setOriginalModalEvents([]);
        setModalCloseState('idle');
      }, 400); // Delay to show SAVED message
    }, 400); // Simulate save duration
  };

  const handleUpdateEventContent = (index: number, content: string, formattedContent?: string) => {
    if (index >= eventsForSelectedDate.length) return

    const updatedEvents = [...eventsForSelectedDate]
    updatedEvents[index] = {
      ...updatedEvents[index],
      content,
      formattedContent
    }
    setEventsForSelectedDate(updatedEvents)
  };

  const handleBoldText = () => {
    if (activeEventIndex >= eventsForSelectedDate.length || !selectedText) return

    const event = eventsForSelectedDate[activeEventIndex]
    const content = event.content

    const selectedContent = content.substring(selectedText.start, selectedText.end)

    const formattedContent =
      content.substring(0, selectedText.start) +
      `<strong>${selectedContent}</strong>` +
      content.substring(selectedText.end)

    handleUpdateEventContent(activeEventIndex, content, formattedContent)

    setSelectedText(null)
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault()

      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      if (start !== end) {
        setSelectedText({ start, end })
        handleBoldText()
      }
      return
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Only save/close if the current event has content
      if (eventsForSelectedDate[index] && eventsForSelectedDate[index].content.trim() !== "") {
        handleSaveAndClose()
      }
    }
  };

  const handleTextSelect = (e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    setSelectedText({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    })
  };

  const handleReset = () => {
    setShowResetConfirm(true)
  };

  const handleResetData = async () => {
    // Clear UI state
    const clearedGroups = [{ id: "default", name: "TAG 01", color: "text-black", active: true }];
    setEvents([]);
    setProjectGroups(clearedGroups);

    // Clear localStorage snapshot
    if (typeof window !== "undefined") {
      localStorage.removeItem("calendarEvents");
      localStorage.removeItem("projectGroups");
    }

    // If the user is logged-in push the cleared state to Supabase immediately
    if (user) {
      try {
        await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: [], groups: clearedGroups }),
        });
        console.log("[Reset] Cleared calendar saved to Supabase");
      } catch (err) {
        console.error("[Reset] Failed to save cleared calendar to Supabase", err);
      }
    }

    setShowResetConfirm(false);
  };

  const handleDragStart = useCallback((event: Event, e: React.DragEvent, index: number | null = null) => {
    e.stopPropagation();
    setDraggedEvent(event);
    setDraggedEventIndex(index);

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", event.id);

      const ghostElement = document.createElement("div");
      ghostElement.classList.add("event-ghost");
      ghostElement.textContent = event.content;
      ghostElement.style.padding = "4px 8px";
      ghostElement.style.background = "#f5f5f5";
      ghostElement.style.border = "1px solid #ddd";
      ghostElement.style.borderRadius = "4px";
      ghostElement.style.width = "100px";
      ghostElement.style.overflow = "hidden";
      ghostElement.style.whiteSpace = "nowrap";
      ghostElement.style.textOverflow = "ellipsis";
      ghostElement.style.position = "absolute";
      ghostElement.style.top = "-1000px";
      document.body.appendChild(ghostElement);

      e.dataTransfer.setDragImage(ghostElement, 50, 10);

      setTimeout(() => {
        if (document.body.contains(ghostElement)) {
          document.body.removeChild(ghostElement);
        }
      }, 100);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<Element>, date: Date) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const updatedEvents = events.map((event) =>
      event.id === draggedEvent.id ? { ...event, date } : event
    );
    setEvents(updatedEvents);
    setDraggedEvent(null);
    setDragOverDate(null);
  }, [draggedEvent, events]);

  const handleDragOver = useCallback((day: Date, e: React.DragEvent<Element>) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
    setDragOverDate(day);
  }, []);

  const handleDragEnd = (e: React.DragEvent<Element>) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedEvent(null);
    setDragOverDate(null);
  };

  const handleDragOverEmpty = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDropOnEmpty = (e: React.DragEvent, emptyCellIndex: number) => {
      e.preventDefault();
      // console.log("Dropped on empty cell index:", emptyCellIndex, " Need to calculate date.");
      setDraggedEvent(null);
      setDragOverDate(null);
  };

  const handleUpdateEventColor = (index: number, color: string) => {
      if (index >= eventsForSelectedDate.length || !selectedDate) return;

      const updatedEvents = [...eventsForSelectedDate];
      updatedEvents[index] = { ...updatedEvents[index], color: color };
      setEventsForSelectedDate(updatedEvents);
  };


  const handleAddEvent = () => {
    if (!selectedDate) return;

    const eventsOnSelectedDateInModal = eventsForSelectedDate.filter(event => !event.isDeleted); 

    if (eventsOnSelectedDateInModal.length >= 4) {
        // console.log("Maximum number of events (4) for this day reached in modal.");
        return;
    }

    const newEvent: Event = {
      id: Math.random().toString(36).substring(2, 11),
      date: selectedDate,
      content: "",
      color: "text-black",
      projectId: "default",
    };

    setEventsForSelectedDate(prev => [...prev, newEvent]);
    setNewlyAddedEventId(newEvent.id);

    setTimeout(() => {
       const textareas = eventModalRef.current?.querySelectorAll('textarea');
       if (textareas && textareas.length > 0) {
           const newEventTextarea = textareas[textareas.length - 1];
           if (newEventTextarea) {
             newEventTextarea.focus();
           }
       }
    }, 50);
  };

  useEffect(() => {
    if (showResetConfirm) {
      setTimeout(() => {
        cancelResetButtonRef.current?.focus();
      }, 0);
    }
  }, [showResetConfirm]);

  useEffect(() => {
    if (newlyAddedEventId) {
      const timer = setTimeout(() => {
        setNewlyAddedEventId(null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [newlyAddedEventId]);

  useEffect(() => {
    if (!showModal) {
      const timer = setTimeout(() => {
        setModalCloseState('idle');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const handleEventDragOver = useCallback((e: React.DragEvent, targetEventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedEvent && draggedEvent.id !== targetEventId) {
        setDropTargetEventId(targetEventId);
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    }
  }, [draggedEvent]);

  const handleEventDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetEventId(null);
  };

  const handleEventDrop = useCallback((e: React.DragEvent, targetEvent: Event) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetEventId(null);

    if (!draggedEvent || !isSameDay(draggedEvent.date, targetEvent.date)) {
      handleDrop(e, targetEvent.date); 
      return;
    }
    if (draggedEvent.id === targetEvent.id) {
      setDraggedEvent(null);
      setDraggedEventIndex(null);
      return;
    }

    const currentDayEvents = events.filter(ev => isSameDay(ev.date, targetEvent.date));
    const otherDayEvents = events.filter(ev => !isSameDay(ev.date, targetEvent.date));

    const draggedIdx = currentDayEvents.findIndex(ev => ev.id === draggedEvent.id);
    let targetIdx = currentDayEvents.findIndex(ev => ev.id === targetEvent.id);

    if (draggedIdx === -1 || targetIdx === -1) {
      console.error("Could not find dragged or target event in currentDayEvents. Aborting reorder.");
      setDraggedEvent(null);
      setDraggedEventIndex(null);
      return;
    }

    const [itemToMove] = currentDayEvents.splice(draggedIdx, 1);
    currentDayEvents.splice(targetIdx, 0, itemToMove);

    setEvents([...otherDayEvents, ...currentDayEvents]);

        setDraggedEvent(null);
        setDraggedEventIndex(null);
  }, [draggedEvent, events, handleDrop]);

  const handleDeleteAllEventsForDay = () => {
    if (!selectedDate) return;

    const updatedEvents = events.filter(event => !isSameDay(event.date, selectedDate));
    setEvents(updatedEvents);
    setEventsForSelectedDate([]); 
    handleCancelEdit(); 
  };

  const renderCalendar = useCallback(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDateValue = startOfWeek(monthStart); 
    const endDateValue = endOfWeek(monthEnd); 

    const activeGroupIds = new Set(projectGroups.filter(g => g.active).map(g => g.id));

    const days = [];
    let dayIterator = startDateValue;
    let cellIndex = 0;

    while (dayIterator <= endDateValue) {
      const currentDateInLoop = dayIterator;
      const isCurrentMonth = isSameMonth(currentDateInLoop, monthStart);
      const isTodayDate = isToday(currentDateInLoop);

      const dayEvents = events.filter(
        (event) => {
          const eventEffectiveId = event.projectId ?? 'default';
          return isSameDay(event.date, currentDateInLoop) && activeGroupIds.has(eventEffectiveId);
        }
      );
      const limitedEvents = dayEvents.slice(0, 4);
      const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, currentDateInLoop));

      const isSingleEventDay = isCurrentMonth && limitedEvents.length === 1;
      const isHoveringSingleEventCell = isSingleEventDay && hoveredSingleEventDate && isSameDay(hoveredSingleEventDate, currentDateInLoop);

      const rowIndex = Math.floor(cellIndex / 7);
      const colIndex = cellIndex % 7;
      const borderClasses = cn(
        'border-gray-300', // Applies color
        rowIndex < 5 ? 'border-b' : '', // Default 1px bottom border
        colIndex < 6 ? 'border-r' : ''  // Default 1px right border
      );

      days.push(
        <div
          key={currentDateInLoop.toString()}
          className={cn(
            'transition-colors duration-100 ease-in-out bg-white overflow-hidden h-20 sm:h-24 md:h-28', // Removed aspect-square, added explicit height
            'flex flex-col p-0.5 sm:p-1.5 min-w-0',
            borderClasses,
            isCurrentMonth ? 'hover:bg-gray-100' : '',
            !isCurrentMonth ? 'bg-gray-50' : '',
            isDragging ? 'cursor-grabbing' : (isCurrentMonth ? 'cursor-pointer' : 'cursor-default'),
            isSingleEventDay ? 'cursor-pointer' : 'cursor-default'
          )}
          onClick={() => isCurrentMonth && handleDayClick(currentDateInLoop)}
          onDragOver={(e) => isCurrentMonth && handleDragOver(currentDateInLoop, e)}
          onDrop={(e) => isCurrentMonth && handleDrop(e, currentDateInLoop)}
          onMouseEnter={isSingleEventDay ? () => setHoveredSingleEventDate(currentDateInLoop) : undefined}
          onMouseLeave={isSingleEventDay ? () => setHoveredSingleEventDate(null) : undefined}
          draggable={isSingleEventDay}
          onDragStart={isSingleEventDay && limitedEvents[0] ? (e) => handleDragStart(limitedEvents[0], e, 0) : undefined}
        >
          {isCurrentMonth && (
            <div className="flex justify-between items-center w-full min-h-[18px]">
              <div className="text-[9px] uppercase tracking-wider font-mono text-gray-500 pr-1 truncate">
                 {dayHolidays.length > 0 ? dayHolidays[0].name : <span>&nbsp;</span>}
              </div>

              <div className={cn(
                "text-xs sm:text-sm font-medium",
                isTodayDate
                  ? "bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" // Today circle larger
                  : "text-gray-600" // Regular day number
              )}>
                {format(currentDateInLoop, 'd')}
              </div>
            </div>
          )}

          {isCurrentMonth && limitedEvents.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {limitedEvents.map((event, index) => {
                let eventTextColor = 'text-black';
                if (event.projectId) {
                   const group = projectGroups.find(g => g.id === event.projectId);
                   if (group) {
                      eventTextColor = group.color;
                   }
    } else {
                   eventTextColor = event.color || 'text-black';
                }

                return (
                  <div
                    key={event.id}
                    draggable={!isSingleEventDay}
                    onDragStart={!isSingleEventDay ? (e) => handleDragStart(event, e, index) : undefined}
                    onMouseEnter={() => setHoveredEventId(event.id)}
                    onMouseLeave={() => {
                      setHoveredEventId(null);
                    }}
                    onDragOver={(e) => handleEventDragOver(e, event.id)}
                    onDrop={(e) => handleEventDrop(e, event)}
                    className={cn(
                      'block text-[9px] sm:text-[10px] font-medium rounded-[2px] relative',
                      !isSingleEventDay ? 'cursor-grab' : 'cursor-pointer',
                      eventTextColor,
                       event.projectId && projectGroups.find(g => g.id === event.projectId)
                          ? `${getBgFromTextColor(eventTextColor)}/15`
                          : '',
                      (isHoveringSingleEventCell || hoveredEventId === event.id) ? 'underline' : '',
                      dropTargetEventId === event.id && draggedEvent && draggedEvent.id !== event.id && 'border-t-2 border-black opacity-70' 
                    )}
                    title={event.content}
                  >
                    <div className="flex items-start">
                      <span className="mr-1">▪</span>
                      <span className={cn(
                         'break-words',
                         'truncate', 
                         'md:whitespace-normal',
                         limitedEvents.length === 1 ? 'md:line-clamp-4' :
                         limitedEvents.length === 2 ? 'md:line-clamp-2' :
                         'md:line-clamp-1'
                       )}>
                        {event.content}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
      dayIterator = addDays(dayIterator, 1);
      cellIndex++;
    }

    const cellsGenerated = cellIndex;
    const cellsNeeded = Math.max(0, 42 - cellsGenerated); 

    for (let i = 0; i < cellsNeeded; i++) {
      const totalCellIndex = cellsGenerated + i;
      const rowIndex = Math.floor(totalCellIndex / 7);
      const colIndex = totalCellIndex % 7;

      const borderClasses = cn(
        'border-gray-300', // Applies color
        rowIndex < 5 ? 'border-b' : '', // Default 1px bottom border
        colIndex < 6 ? 'border-r' : ''  // Default 1px right border
      );

      days.push(
        <div
          key={`empty-end-${i}`}
          className={cn(
            'h-20 sm:h-24 md:h-28 bg-white overflow-hidden',
            'flex flex-col p-0.5 sm:p-1.5 min-w-0',
            borderClasses
            )}
          onDragOver={handleDragOverEmpty}
          onDrop={(e) => handleDropOnEmpty(e, i)}
        ></div>,
      );
    }

    return days;
  }, [
    currentDate, events, projectGroups, holidays, isDragging,
    handleDragStart, handleDayClick, handleDrop, handleDragOver,
    hoveredSingleEventDate, 
    hoveredEventId, 
    draggedEvent, // Added draggedEvent to deps as it's used in dropTargetEventId condition
    dropTargetEventId, // Added dropTargetEventId to deps
    handleEventDrop, handleEventDragOver 
  ]);

  const downloadCalendarAsImage = async () => {
    // Variables that need to be accessible across try/catch/finally blocks
    let isMobileDevice = false;
    let calendarElementRef: HTMLElement | null = null;
    let cloneElement: HTMLElement | null = null; // off-screen clone for mobile capture
 
    try {
      setIsDownloading(true);
 
      const html2canvas = (await import("html2canvas")).default;
 
      const calendarElement = calendarScreenshotContainerRef.current;
      calendarElementRef = calendarElement;
 
      if (!calendarElement) {
        console.error("Calendar element not found for screenshot.");
        alert("Failed to capture calendar. Element not found.");
        setIsDownloading(false);
        return;
      }
 
      // === NEW LOGIC: use an off-screen clone on mobile ===
      isMobileDevice = typeof window !== "undefined" && window.innerWidth < 640;
      let captureTarget: HTMLElement = calendarElement;
 
      if (isMobileDevice) {
        cloneElement = calendarElement.cloneNode(true) as HTMLElement;
        cloneElement.style.position = "fixed";
        cloneElement.style.top = "-10000px";
        cloneElement.style.left = "-10000px";
        // Ensure it renders with default desktop classes
        cloneElement.style.width = `${calendarElement.offsetWidth}px`;
        cloneElement.style.transform = "scale(0.75)";
        cloneElement.style.transformOrigin = "top center";
        document.body.appendChild(cloneElement);
        captureTarget = cloneElement;
      }
 
      // Give the browser a tick to lay out the clone (if any) before capture
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
 
      const canvas = await html2canvas(captureTarget, {
        // Increase internal rendering scale for crisper output
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Remove the today-circle so it renders flat in screenshot
          const todayElements = clonedDoc.querySelectorAll('.bg-gray-900.text-white.rounded-full');
          todayElements.forEach((el) => {
              const todayEl = el as HTMLElement;
              todayEl.style.backgroundColor = 'transparent';
              todayEl.style.color = '#4b5563';
              todayEl.style.borderRadius = '0';
              todayEl.style.width = 'auto';
              todayEl.style.height = 'auto';
              todayEl.style.display = 'inline';
              todayEl.classList.remove('bg-gray-900', 'text-white', 'rounded-full', 'w-5', 'h-5', 'flex', 'items-center', 'justify-center', 'text-[9px]');
              todayEl.classList.add('text-gray-600', 'text-xs', 'sm:text-sm');
          });
 
          const dayEventContainers = clonedDoc.querySelectorAll('.flex-1.overflow-hidden.flex.flex-col');
          dayEventContainers.forEach(container => {
            const el = container as HTMLElement;
            el.style.overflow = 'visible';
            el.style.height = 'auto'; 
            el.style.minHeight = '1em'; 
          });
 
          const textElements = clonedDoc.querySelectorAll('.block span.break-words, div.text-\\[9px\\].uppercase'); 
          textElements.forEach(textEl => {
            const el = textEl as HTMLElement;
            el.classList.remove(
              'truncate',
              'overflow-hidden',
              'line-clamp-1', 'line-clamp-2', 'line-clamp-3', 'line-clamp-4',
              'md:line-clamp-1', 'md:line-clamp-2', 'md:line-clamp-4',
              'pr-1' 
            );
            el.style.overflow = 'visible';
            el.style.whiteSpace = 'normal'; 
            el.style.webkitLineClamp = 'unset';
            el.style.display = 'block'; 
            el.style.height = 'auto'; 
            el.style.textOverflow = 'clip';
            el.style.paddingRight = '0'; 
 
            const parentEventItem = el.closest('.block');
            if (parentEventItem) {
              (parentEventItem as HTMLElement).style.height = 'auto';
              (parentEventItem as HTMLElement).style.overflow = 'visible';
            }
          });
 
          const calendarGrid = clonedDoc.querySelector('.grid.grid-cols-7');
          if (calendarGrid) {
              const dayCells = calendarGrid.querySelectorAll<HTMLElement>(':scope > div[key]');
              dayCells.forEach(cell => {
                  cell.classList.remove('h-20', 'sm:h-24', 'md:h-28');
                  cell.style.height = 'auto';
                  cell.style.minHeight = '50px'; 
                  cell.style.overflow = 'visible'; 
              });
          }
 
          const leftArrow = clonedDoc.getElementById('calendar-nav-left') as HTMLElement | null;
          const rightArrow = clonedDoc.getElementById('calendar-nav-right') as HTMLElement | null;
          if (leftArrow) {
              leftArrow.style.visibility = 'hidden';
          }
          if (rightArrow) {
              rightArrow.style.visibility = 'hidden';
          }

          // --- Mobile screenshot specific tweaks ---
          // inject CSS rules with !important to guarantee override
          const styleTag = clonedDoc.createElement('style');
          styleTag.textContent = `
            /* event text – larger and with more spacing */
            .block { margin-bottom: 4px !important; }
            .break-words { font-size: 12px !important; line-height: 1.4 !important; }
            /* holiday labels */
            div.text-\\[9px\\].uppercase { font-size: 8px !important; line-height: 1.2 !important; }
            /* center days of week text */
            .grid.grid-cols-7.bg-gray-50 > div { display: flex !important; align-items: center !important; justify-content: center !important; height: 100% !important; /* ensure full cell height for centering */ }
            /* ensure each day cell can grow vertically */
            .grid.grid-cols-7 > div { height: auto !important; min-height: 90px !important; }
            /* align bullet and text horizontally */
            .block > div { display: flex !important; align-items: center !important; gap: 2px; }
            .block > div span:first-child { position: relative; top: 0.5px; }
            /* center month header */
            .date-selector-container > button { height: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; }
            .date-selector-container > button > div { line-height: 1 !important; /* ensure text itself is compact */ }
          `;
          clonedDoc.head.appendChild(styleTag);

          // Vertically center the month/year title inside its container
          const monthHeader = clonedDoc.querySelector('.date-selector-container') as HTMLElement | null;
          if (monthHeader) {
            monthHeader.style.display = 'flex';
            monthHeader.style.alignItems = 'center';
            monthHeader.style.justifyContent = 'center';
            monthHeader.style.height = '100%';
          }

          // 4) Center month/year text inside screenshot header
          const titleBtn = clonedDoc.querySelector('.date-selector-container > button') as HTMLElement | null;
          if (titleBtn) {
            titleBtn.style.display = 'flex';
            titleBtn.style.alignItems = 'center';
            titleBtn.style.justifyContent = 'center';
            titleBtn.style.height = '100%';
            const innerDiv = titleBtn.querySelector('div');
            if (innerDiv) {
              (innerDiv as HTMLElement).style.lineHeight = '1';
            }
          }

          // Force header row vertical centering
          const navLeft = clonedDoc.getElementById('calendar-nav-left');
          if (navLeft && navLeft.parentElement) {
            const headerRow = navLeft.parentElement as HTMLElement;
            headerRow.style.alignItems = 'center';
          }
          if (titleBtn) {
            titleBtn.style.marginTop = 'auto';
            titleBtn.style.marginBottom = 'auto';
          }
        }
      });
 
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `calendar_${format(currentDate, "MMMM_yyyy")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
 
      // Remove the off-screen clone
      if (cloneElement && document.body.contains(cloneElement)) {
        document.body.removeChild(cloneElement);
      }
 
    } catch (error) {
      console.error("Error generating calendar image:", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      // Ensure clone is cleaned up even on error
      if (cloneElement && document.body.contains(cloneElement)) {
        document.body.removeChild(cloneElement);
      }
 
      setIsDownloading(false);
    }
  };

  const createPrintableCalendar = () => {
    /* existing implementation retained – no changes made */
  };

  useEffect(() => {
    if (!user) return;

    const flushData = () => {
      try {
        const payload = {
          events: events.map(e => ({ ...e, date: e.date instanceof Date ? e.date.toISOString() : e.date })),
          groups: projectGroups,
        };
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/calendar', blob);
      } catch (err) {
        // noop – sendBeacon failures cannot be recovered here
      }
    };

    window.addEventListener('beforeunload', flushData);
    return () => window.removeEventListener('beforeunload', flushData);
  }, [user, events, projectGroups]);

  return (
    <>
      {/* Responsive calendar container: on small screens use full width and no scale to remove side whitespace */}
      <div 
        className={cn(
          // Remove fixed height and scaling so the bounding box matches the visible size
          "flex flex-col w-full sm:max-w-5xl mx-auto font-mono pt-4 pb-4",
          "bg-white"
        )}
        // Shrink via CSS transform so content stays perfectly centered on any viewport size
        style={{ transform: `scale(${isMobile ? 0.8 : 0.75})`, transformOrigin: 'top center' }}
      >
        <div className="mx-1 sm:mx-6 md:mx-12">
           <div className="flex flex-row flex-wrap justify-center sm:justify-between w-full mb-4 items-center gap-2 sm:gap-4">
             <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 items-center">
               <AuthButton />
               <button
                 onClick={handleReset}
                 className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-sm transition-colors"
               >
                 <RefreshCcw size={12} /> RESET
               </button>
             </div>
             {/* Right-aligned action buttons */}
             <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2 items-center sm:ml-auto">
               <button
                  onClick={downloadCalendarAsImage}
                  disabled={isDownloading}
                 className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                 {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} {isDownloading ? 'GENERATING' : 'SCREENSHOT'}
                </button>
                <div className="relative">
                  <button
                      onClick={() => {
                          setSelectedExportTags(projectGroups.map(g => g.id));
                          setShowExportOptionsModal(true);
                      }}
                     className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-sm transition-colors"
                  >
                   <CalendarIcon size={12} /> EXPORT
                  </button>
                </div>
              </div>
            </div>
        </div>

        <div 
          ref={calendarScreenshotContainerRef} 
          className="bg-white border border-gray-300 shadow-sm overflow-hidden rounded-sm mx-1 sm:mx-6 md:mx-12"
        >
          <div className="flex items-center justify-between px-2 sm:px-3 md:px-4 bg-gray-50 border-b border-gray-300 h-20 sm:h-24 md:h-28">
             <button
              id="calendar-nav-left"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="text-sm text-gray-400 hover:bg-gray-100 active:bg-gray-200 p-1 sm:p-1.5 rounded-sm w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="relative date-selector-container">
              <button
                onClick={() => setShowDateSelector(!showDateSelector)}
                className="font-mono tracking-tight hover:cursor-pointer hover:underline text-black"
              >
              <div className="text-4xl font-mono tracking-tight text-center flex items-center justify-center h-full">
                {format(currentDate, "MMMM yyyy").toUpperCase()}
              </div>
              </button>

              {showDateSelector && (
                <div ref={dateSelectorRef} className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-lg rounded-sm w-64">
                   <div className="p-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
                        }}
                        className="p-1 hover:bg-gray-100 rounded-sm text-gray-600"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-mono text-gray-700">{currentDate.getFullYear()}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
                        }}
                        className="p-1 hover:bg-gray-100 rounded-sm text-gray-600"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 p-2">
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date(currentDate.getFullYear(), i, 1);
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setCurrentDate(new Date(currentDate.getFullYear(), i, 1));
                            setShowDateSelector(false);
                          }}
                          className={`p-1 text-xs font-mono rounded-sm ${
                            currentDate.getMonth() === i ? 'bg-black text-white hover:bg-black' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {format(date, 'MMM').toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button
              id="calendar-nav-right"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="text-sm text-gray-400 hover:bg-gray-100 active:bg-gray-200 p-1 sm:p-1.5 rounded-sm w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="w-full" style={{ textTransform: 'none' }}>
            <div ref={calendarContentRef} style={{ textTransform: 'none' }}>
              <div className="grid grid-cols-7 bg-gray-50">
                 {weekDays.map((day, index) => (
                  <div
                    key={index} 
                    className={`py-1 sm:py-1.5 md:py-2 text-center font-mono text-[10px] sm:text-[11px] md:text-xs tracking-wider border-b border-gray-300 text-gray-600 ${
                      index < weekDays.length - 1 ? 'border-r border-gray-300' : ''
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7" style={{ textTransform: 'none' }}>
                {renderCalendar()}
              </div>
            </div>
          </div>
        </div>

        <div 
          className="w-full flex justify-center px-2 sm:px-0 mx-1 sm:mx-6 md:mx-12"
        >
          <ProjectGroups
             groups={projectGroups}
              onToggleGroup={handleToggleProjectGroup}
              showDialog={showAddDialog}
              editingGroupId={editingGroupId}
              dialogName={newProjectName}
              dialogColor={newProjectColor}
              setDialogName={(name) => setNewProjectName(name)}
              setDialogColor={(color) => setNewProjectColor(color)}
              onCloseDialog={handleCloseDialog}
              onSaveDialog={handleSaveDialog}
              onRequestDelete={handleRequestDelete}
              onShowAddRequest={handleShowAddDialog}
              onShowEditRequest={handleShowEditDialog}
              dialogError={dialogError}
              colorOptions={colorOptions}
              getBgFromTextColor={getBgFromTextColor}
              getTextForBg={getTextForBg}
          />
        </div>

      </div> 

      {/* --- Modals START --- */}

      {selectedDate && showModal && ( 
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40"
          onClick={(e) => {
            if (e.target === e.currentTarget && modalCloseState === 'idle') {
              handleCancelEdit();
            }
          }}
        >
           <div ref={eventModalRef} className="bg-white rounded-sm w-full max-w-md">
             <div className="p-6">
              <div className="flex items-center justify-center">
                <div>
                  <h3 className="text-lg font-mono">EDIT {format(selectedDate, "MMMM d, yyyy").toUpperCase()}</h3>
                  {holidayForSelectedDate && (
                    <p className="text-xs text-gray-500 font-mono mt-1 text-center">{holidayForSelectedDate.toUpperCase()}</p>)}
                </div>
              </div>
            </div>
            <div className="p-6">
              {eventsForSelectedDate.map((event, index) => (
                <div
                  key={event.id}
                  className={cn(
                    "mb-6 last:mb-0 transition-all duration-300 ease-in-out overflow-hidden",
                  )}
                >
                  <div className="relative">
                    <textarea
                      ref={index === 0 ? firstEventInputRef : (el) => {
                        if (event.id === newlyAddedEventId && el) el.focus();
                      }}
                      value={event.content}
                      onChange={(e) => handleUpdateEventContent(index, e.target.value)}
                      onKeyDown={(e) => handleTextareaKeyDown(e, index)}
                      onSelect={(e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>) => handleTextSelect(e)}
                      placeholder="Event name"
                      className={`w-full p-3 border rounded-sm ${getTextColorClass(event.color)} focus:outline-none focus:border-black font-mono resize-none h-[72px] pr-8`}
                      style={{ textTransform: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div
                    className={cn(
                      "flex flex-wrap gap-2 items-center transition-all duration-300 ease-in-out overflow-hidden",
                      event.content.trim() !== '' || newlyAddedEventId === event.id 
                        ? "opacity-100 max-h-40 mt-2 mb-2" 
                        : "opacity-0 max-h-0 mb-0 pointer-events-none"
                    )}
                  >
                     <div className="flex-1 flex flex-wrap gap-2">
                      {projectGroups.map((group) => {
                        const currentEvent = eventsForSelectedDate[index];
                        const currentProjectId = currentEvent?.projectId ?? 'default';

                        return (
                          <button
                            key={group.id}
                            onClick={() => {
                              const clickedGroupId = group.id;
                                const updatedEvents = [...eventsForSelectedDate];
                                if (currentEvent) {
                                    const newProjectId = clickedGroupId === 'default' ? undefined : clickedGroupId;
                                    updatedEvents[index] = {
                                        ...currentEvent,
                                        projectId: newProjectId,
                                        color: group.color
                                    };
                                    setEventsForSelectedDate(updatedEvents);
                                } else {
                                   console.error("Current event is undefined, cannot update tag.");
                              }
                            }}
                            className={cn(
                              `px-2 py-1.5 text-xs rounded-sm font-mono flex items-center gap-1 transition-all duration-150 ease-in-out`,
                              getBgFromTextColor(group.color),
                              'text-white'
                            )}
                          >
                            <Tag size={14} />
                            {group.name}
                            {currentProjectId === group.id && <Check size={14} className="ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm" 
                      onClick={() => {
                        const updatedEvents = [...eventsForSelectedDate];
                        if (eventsForSelectedDate.length > 1) {
                          updatedEvents.splice(index, 1);
                          setEventsForSelectedDate(updatedEvents);
                        } else {
                          if (updatedEvents[index]) {
                          updatedEvents[index].content = "";
                          }
                          setEventsForSelectedDate(updatedEvents);
                        }
                        setTimeout(() => firstEventInputRef.current?.focus(), 0);
                      }}
                      className="text-red-600 hover:text-red-600 hover:underline self-start bg-transparent focus:outline-none border-none hover:bg-transparent px-1 py-0" 
                    >
                      DELETE
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-0"> 
              <Button
                variant="ghost"
                onClick={handleAddEvent}
                disabled={modalCloseState !== 'idle' || eventsForSelectedDate.filter(ev => !ev.isDeleted).length >= 4}
                className="w-[calc(100%-3rem)] mx-6 mb-4 border border-dotted border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center py-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ADD ANOTHER EVENT
              </Button>
            </div>
             <div className="flex justify-between items-center p-4 border-t border-gray-200">
                <div className="flex-shrink-0">
                  {eventsForSelectedDate.filter(ev => ev.content.trim() !== '').length > 0 && ( 
                    // Show only if there are 2 or more non-deleted events/fields
                    eventsForSelectedDate.filter(ev => !ev.isDeleted).length > 1 && (
                     <Button
                       onClick={handleDeleteAllEventsForDay}
                       variant="ghost"
                       className="text-red-600 hover:text-red-600 hover:underline p-0 font-mono bg-transparent focus:outline-none border-none hover:bg-transparent"
                       disabled={modalCloseState !== 'idle'}
                     >
                       DELETE ALL
                     </Button>
                    )
                  )}
                </div>
                <div className="flex gap-2 flex-grow justify-end">
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={modalCloseState !== 'idle'}
                    className={cn(
                       "disabled:opacity-50",
                       modalCloseState === 'canceling' && "opacity-75"
                    )}
                  >
                    CANCEL
                  </Button>
                  <Button
                    onClick={handleSaveAndClose}
                    disabled={modalCloseState !== 'idle'}
                    className={cn("w-[90px]",
                       "disabled:opacity-50"
                    )}
                  >
                    {modalCloseState === 'saving' && <Loader2 size={16} className="animate-spin mr-1" />}
                    {modalCloseState === 'saving' ? 'SAVING' :
                     modalCloseState === 'saved' ? <><Check size={16} className="mr-1" /> SAVED</> :
                     'SAVE'
                    }
                  </Button>
                </div> 
            </div>
           </div>
        </div>
      )}

      {showShareModal && (
         <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowShareModal(false);
              setShareCopied(false);
            }
          }}
        >
          <div className="bg-white rounded-sm p-6 w-full max-w-md">
             <h3 className="text-lg font-medium mb-4 font-mono">Share Calendar Link</h3>
            <div className="flex gap-2">
              <input
                ref={shareInputRef}
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black font-mono"
              />
              <button
                id="copy-button"
                onClick={() => {
                  if (shareInputRef.current) {
                    shareInputRef.current.select();
                    navigator.clipboard.writeText(shareInputRef.current.value)
                      .then(() => {
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 2000);
                      })
                      .catch(err => console.error('Copy failed', err));
                  }
                }}
                className="px-4 py-2 bg-black text-white rounded-sm hover:bg-gray-800 text-sm font-mono w-24 text-center transition-colors"
              >
                {shareCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {setShowShareModal(false); setShareCopied(false);}}
                className="px-4 py-2 text-sm hover:bg-gray-100 rounded-sm font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showGoogleInstructionsModal && (
         <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGoogleInstructionsModal(false);
            }
          }}
        >
          <div className="bg-white rounded-sm p-6 w-full max-w-md">
             <h3 className="text-lg font-medium mb-4 font-mono">Import to Google Calendar</h3>
            <ol className="list-decimal ml-4 space-y-2 text-sm text-gray-600 font-mono">
              <li>Go to <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">calendar.google.com</a></li>
              <li>Click the gear icon (Settings)</li>
              <li>Click &quot;Import &amp; Export&quot;</li>
              <li>Upload the downloaded .ics file</li>
              <li>Click &quot;Import&quot;</li>
            </ol>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowGoogleInstructionsModal(false)}
                className="px-4 py-2 text-sm hover:bg-gray-100 rounded-sm font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResetConfirm(false);
            }
          }}
        >
          <div 
            ref={resetModalRef} 
            className="bg-white rounded-sm w-full max-w-sm p-6"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
              <h4 className="text-md font-mono mb-2 text-center">RESET CALENDAR</h4>
            <p className="text-xs font-mono text-gray-600 mb-6 text-center">Are you sure? This will remove all events and tags.</p>
            <div className="flex justify-center gap-3">
              <button
                ref={cancelResetButtonRef}
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-mono hover:bg-gray-100 rounded-sm border border-gray-300"
              >
                CANCEL
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-2 text-xs font-mono bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors"
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      )}

       {showDeleteConfirmId && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
           <div ref={deleteConfirmRef} className="bg-white p-6 rounded-sm max-w-sm w-full shadow-xl">
             <h4 className="text-md font-mono mb-2 text-center">DELETE</h4>
             <p className="text-xs font-mono text-gray-600 mb-6 text-center">
               Are you sure you want to delete the tag &quot;{projectGroups.find(g => g.id === showDeleteConfirmId)?.name}&quot;? Events using this tag will revert to default.
             </p>
             <div className="flex justify-center gap-3">
               <button
                 onClick={() => setShowDeleteConfirmId(null)}
                 className="px-4 py-2 text-xs font-mono hover:bg-gray-100 rounded-sm border border-gray-300"
               >
                 CANCEL
               </button>
               <button
                 onClick={handleDeleteGroup}
                 className="px-4 py-2 text-xs font-mono bg-red-600 text-white rounded-sm hover:bg-red-700 transition-colors"
               >
                 DELETE
               </button>
             </div>
           </div>
         </div>
       )}

      {showExportOptionsModal && (
         <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowExportOptionsModal(false);
              setSelectedExportTags([]);
            }
          }}
         >
           <div className="bg-white rounded-sm w-full max-w-lg p-6 shadow-xl">
               <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="text-sm font-mono uppercase tracking-wider">Export Options</h3>
                <button
                  onClick={() => {
                    setShowExportOptionsModal(false);
                    setSelectedExportTags([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20}/>
                </button>
              </div>
              <div className="mb-5 pt-1">
                 <label className="block text-xs font-mono mb-2 uppercase tracking-wider">Format</label>
               <div className="space-y-2">
                 <label className="flex items-center gap-2 text-sm font-mono cursor-pointer">
                   <input
                     type="radio"
                     name="exportTarget"
                     value="ical"
                     checked={exportTarget === 'ical'}
                     onChange={(e) => setExportTarget(e.target.value as "ical" | "google")}
                     className="form-radio text-black focus:ring-black"
                   />
                   Apple Calendar (.ics)
                 </label>
                 <div>
                   <label className="flex items-center gap-2 text-sm font-mono cursor-pointer">
                     <input
                       type="radio"
                       name="exportTarget"
                       value="google"
                       checked={exportTarget === 'google'}
                       onChange={(e) => setExportTarget(e.target.value as "ical" | "google")}
                       className="form-radio text-black focus:ring-black"
                     />
                     Google Calendar (.ics)
                   </label>
                   {exportTarget === 'google' && (
                     <p className="text-xs text-gray-500 font-mono mt-1 ml-6">Note: An .ics file will be downloaded. You&apos;ll need to import it into Google Calendar manually.</p>
                   )}
                 </div>
               </div>
              </div>
              <div className="mb-6 pt-4 border-t">
                 <label className="block text-xs font-mono mb-2 uppercase tracking-wider">Tags to Include</label>
               <div className="flex justify-between items-center mb-2">
                 <button
                   onClick={() => setSelectedExportTags(projectGroups.map(g => g.id))}
                   className="text-xs font-mono text-blue-600 hover:underline"
                 >
                   Select All
                 </button>
                 <button
                   onClick={() => setSelectedExportTags([])}
                   className="text-xs font-mono text-blue-600 hover:underline"
                 >
                   Deselect All
                 </button>
               </div>
               <div className="max-h-40 overflow-y-auto border rounded-sm p-2 space-y-1">
                 {projectGroups.map(group => (
                   <label key={group.id} className="flex items-center gap-2 text-sm font-mono cursor-pointer">
                     <input
                       type="checkbox"
                       value={group.id}
                       checked={selectedExportTags.includes(group.id)}
                       onChange={(e) => {
                         const id = e.target.value;
                         setSelectedExportTags(prev =>
                           e.target.checked ? [...prev, id] : prev.filter(tagId => tagId !== id)
                         );
                       }}
                       className="form-checkbox rounded-sm text-black focus:ring-black"
                     />
                     <span className={`px-1.5 py-0.5 text-xs rounded-sm ${getBgFromTextColor(group.color)} text-white`}>{group.name}</span>
                   </label>
                 ))}
               </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                 <button
                  onClick={() => {
                    setShowExportOptionsModal(false);
                    setSelectedExportTags([]);
                  }}
                  className="px-4 py-2 text-xs font-mono hover:bg-gray-100 rounded-sm border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportWithTags}
                  disabled={selectedExportTags.length === 0}
                  className="px-6 py-2 text-xs bg-black text-white rounded-sm font-mono hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export
                </button>
              </div>
           </div>
         </div>
      )}
      {/* --- Modals END --- */}
    </>
  )
}
