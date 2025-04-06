"use client"

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, getDay, getDaysInMonth, parse, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Tag, X, User, AlertTriangle, Camera, Calendar as CalendarIcon, Link, ArrowUpDown, Check, RefreshCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import ProjectGroups from './project-groups';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  date: Date;
  content: string;
  formattedContent?: string;
  color?: string;
  projectId?: string;
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

  const [currentDate, setCurrentDate] = useState(() => {
    const dateParam = searchParams.get('date');
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

  const [events, setEvents] = useState<Event[]>(() => {
    let loadedEvents: Event[] = [];
    let loadedGroups: ProjectGroup[] = [{ id: 'default', name: 'TAG 01', color: 'text-black', active: true }];
    if (typeof window !== 'undefined') {
      const savedGroups = localStorage.getItem('projectGroups');
      if (savedGroups) {
        try {
          loadedGroups = JSON.parse(savedGroups);
        } catch (e) { console.error("Failed parse groups on load"); }
      }

      const savedEvents = localStorage.getItem('calendarEvents');
      if (savedEvents) {
        try {
          const parsedEvents: Event[] = JSON.parse(savedEvents, (key, value) => {
            if (key === 'date' && typeof value === 'string') {
              return parse(value, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date());
            }
            return value;
          });

          loadedEvents = parsedEvents.map(event => {
            if (event.projectId) {
              const matchingGroup = loadedGroups.find(g => g.id === event.projectId);
              if (matchingGroup && event.color !== matchingGroup.color) {
                 console.log(`Correcting color for event ${event.id} (projectId: ${event.projectId}) from ${event.color} to ${matchingGroup.color}`);
                 return { ...event, color: matchingGroup.color };
              }
            }

            if (!event.projectId && event.color !== 'text-black') {
                 console.log(`Correcting color for untagged event ${event.id} to default`);
                 return { ...event, color: 'text-black' };
            }
            return event;
          });

        } catch (e) {
          console.error("Failed to parse/correct saved events:", e);
          loadedEvents = [];
        }
      }
    }
    return loadedEvents;
  });

  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>(() => {
    let loadedGroups: ProjectGroup[] = [];
    const defaultGroups = [{ id: 'default', name: 'TAG 01', color: 'text-black', active: true }];
    const validColorValues = new Set(colorOptions.map(opt => opt.value));

    if (typeof window !== 'undefined') {
      const savedGroups = localStorage.getItem('projectGroups');
      if (savedGroups) {
        try {
          const parsedGroups: ProjectGroup[] = JSON.parse(savedGroups);
          let foundDefault = false;
          loadedGroups = parsedGroups.map(group => {
            if (group.id === 'default') {
              foundDefault = true;
              return { ...group, name: 'TAG 01', color: 'text-black' };
            }
            if (!validColorValues.has(group.color)) {
              console.warn(`Invalid color "${group.color}" found for group "${group.name}". Resetting to default.`);
              return { ...group, color: 'text-black' };
            }
            return group;
          });

          if (!foundDefault) {
            loadedGroups.unshift(defaultGroups[0]);
          }

        } catch (e) {
          console.error("Failed to parse/correct saved groups:", e);
          loadedGroups = defaultGroups;
        }
      } else {
        loadedGroups = defaultGroups;
      }
    } else {
      loadedGroups = defaultGroups;
    }
    return loadedGroups;
  });

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

  useEffect(() => {
    try {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 640)
      }
      checkIfMobile()
      window.addEventListener("resize", checkIfMobile)

      const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            console.log("Left arrow key pressed");
            console.log("Current date before change:", currentDate);
            setCurrentDate(prevDate => {
              const newDate = subMonths(prevDate, 1);
              console.log("New date after change:", newDate);
              return newDate;
            });
            const leftArrow = document.getElementById('calendar-nav-left');
            if (leftArrow) {
              console.log("Left arrow element found");
              leftArrow.style.color = 'black';
              setTimeout(() => leftArrow.style.color = '', 75);
            } else {
              console.log("Left arrow element not found");
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
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const eventsToSave = JSON.stringify(events, (key, value) => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        });
        localStorage.setItem('calendarEvents', eventsToSave);
      } catch (e) {
        console.error("Failed to save events:", e);
      }
    }
  }, [events]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('projectGroups', JSON.stringify(projectGroups));
      } catch (e) {
        console.error("Failed to save groups:", e);
      }
    }
  }, [projectGroups]);

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

    let icalString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YourCalendarApp//DIY Calendar//EN
`;

    eventsToExport.forEach(event => {
      const startDate = format(event.date, 'yyyyMMdd');
      const summary = event.content.replace(/\r\n|\r|\n/g, '\\n');

      icalString += `BEGIN:VEVENT
`;
      icalString += `UID:${event.id}@yourdomain.com\n`;
      icalString += `DTSTAMP:${format(new Date(), 'yyyyMMdd\'T\'HHmmss\'Z\'')}\n`;
      icalString += `DTSTART;VALUE=DATE:${startDate}\n`;
      icalString += `SUMMARY:${summary}\n`;
      icalString += `END:VEVENT\n`;
    });

    icalString += `END:VCALENDAR`;

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

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    const existingEvents = events.filter((event) => isSameDay(event.date, day))
    setEventsForSelectedDate(existingEvents)
    setActiveEventIndex(0)

    const dayHoliday = holidays.find((holiday) => isSameDay(holiday.date, day));
    setHolidayForSelectedDate(dayHoliday ? dayHoliday.name : null);

    setShowModal(true)

    if (existingEvents.length === 0) {
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
  }

  const handleCancelEdit = () => {
    setModalCloseState('canceling');
    setTimeout(() => {
      setShowModal(false)
      setSelectedDate(null)
      setActiveEventIndex(0)
    }, 150);
  }

  const handleSaveAndClose = () => {
    setModalCloseState('saving');

    if (selectedDate) {
        const nonEmptyEvents = eventsForSelectedDate.filter((event) => event.content.trim() !== "");
        const eventsToSave = nonEmptyEvents.map(ev => ({ ...ev, date: selectedDate }));
        const otherEvents = events.filter((event) => !isSameDay(event.date, selectedDate));
        const newEvents = [...otherEvents, ...eventsToSave];
        setEvents(newEvents);

        try {
            const eventsToSaveString = JSON.stringify(newEvents, (key, value) => {
                if (value instanceof Date) { return value.toISOString(); }
                return value;
            });
            localStorage.setItem("calendarEvents", eventsToSaveString);
        } catch (e) {
            console.error("Failed to save events during save & close:", e);
        }
    }

    setModalCloseState('saved');

    setTimeout(() => {
      setShowModal(false)
      setSelectedDate(null)
      setActiveEventIndex(0)
    }, 400);
  }

  const handleUpdateEventContent = (index: number, content: string, formattedContent?: string) => {
    if (index >= eventsForSelectedDate.length) return

    const updatedEvents = [...eventsForSelectedDate]
    updatedEvents[index] = {
      ...updatedEvents[index],
      content,
      formattedContent
    }
    setEventsForSelectedDate(updatedEvents)
  }

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
  }

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
      handleSaveAndClose()
    }
  }

  const handleTextSelect = (e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    setSelectedText({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    })
  }

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const handleResetData = () => {
    setEvents([])
    setProjectGroups([{ id: "default", name: "TAG 01", color: "text-black", active: true }])
    localStorage.removeItem("calendarEvents")
    localStorage.removeItem("projectGroups")
    setShowResetConfirm(false)
  }

  const handleDragStart = (event: Event, e: React.DragEvent) => {
    e.stopPropagation()
    setDraggedEvent(event)

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", event.id)

      const ghostElement = document.createElement("div")
      ghostElement.classList.add("event-ghost")
      ghostElement.textContent = event.content
      ghostElement.style.padding = "4px 8px"
      ghostElement.style.background = "#f5f5f5"
      ghostElement.style.border = "1px solid #ddd"
      ghostElement.style.borderRadius = "4px"
      ghostElement.style.width = "100px"
      ghostElement.style.overflow = "hidden"
      ghostElement.style.whiteSpace = "nowrap"
      ghostElement.style.textOverflow = "ellipsis"
      ghostElement.style.position = "absolute"
      ghostElement.style.top = "-1000px"
      document.body.appendChild(ghostElement)

      e.dataTransfer.setDragImage(ghostElement, 50, 10)

      setTimeout(() => {
        if (document.body.contains(ghostElement)) {
            document.body.removeChild(ghostElement)
        }
      }, 100)
    }
  }

  const handleDragOver = (day: Date, e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move"
    }
    setDragOverDate(day)
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (!draggedEvent) return

    const updatedEvents = events.map((event) =>
      event.id === draggedEvent.id ? { ...event, date } : event,
    )
    setEvents(updatedEvents)
    setDraggedEvent(null)
    setDragOverDate(null)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedEvent(null)
    setDragOverDate(null)
  }

  const handleShare = () => {
    const url = new URL(window.location.href);
    const dateString = format(currentDate, "yyyy-MM");
    url.searchParams.set("date", dateString);

    const activeTagIds = projectGroups.filter(g => g.active).map(g => g.id);
    if (activeTagIds.length > 0 && activeTagIds.length < projectGroups.length) {
        url.searchParams.set("tags", activeTagIds.join(','));
    } else {
        url.searchParams.delete("tags");
    }

    const generatedUrl = url.toString();
    setShareUrl(generatedUrl);
    setShowShareModal(true);

    setTimeout(() => {
      if (shareInputRef.current) {
        shareInputRef.current.focus();
        shareInputRef.current.select();
      }
    }, 100);
  };

  const downloadCalendarAsImage = async () => {
    try {
      setIsDownloading(true);

      const html2canvas = (await import("html2canvas")).default;

      const calendarElement = calendarScreenshotContainerRef.current;

      if (!calendarElement) {
        console.error("Calendar element not found for screenshot.");
        alert("Failed to capture calendar. Element not found.");
        setIsDownloading(false);
        return;
      }

      const canvas = await html2canvas(calendarElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
            // Remove styling from 'today' marker
            const todayElement = clonedDoc.querySelector('.bg-black.text-white.rounded-full');
            if (todayElement) {
                todayElement.classList.remove('bg-black', 'text-white', 'rounded-full', 'w-5', 'h-5', 'flex', 'items-center', 'justify-center', 'text-[9px]');
                todayElement.classList.add('text-gray-600', 'text-xs', 'sm:text-sm');
            }
            // Hide left/right arrow buttons by ID
            const leftArrow = clonedDoc.getElementById('calendar-nav-left') as HTMLElement | null;
            const rightArrow = clonedDoc.getElementById('calendar-nav-right') as HTMLElement | null;
            if (leftArrow) {
                leftArrow.style.visibility = 'hidden';
            }
            if (rightArrow) {
                rightArrow.style.visibility = 'hidden';
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

    } catch (error) {
      console.error("Error generating calendar image:", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const createPrintableCalendar = () => {
    const printableDiv = document.createElement("div")
    printableDiv.className = "printable-calendar"
    printableDiv.style.position = "absolute"
    printableDiv.style.left = "-9999px"
    printableDiv.style.width = "1200px"
    printableDiv.style.backgroundColor = "white"
    printableDiv.style.color = "#333"
    printableDiv.style.fontFamily = '"JetBrains Mono", monospace'
    printableDiv.style.padding = "40px"

    const header = document.createElement("h2")
    header.textContent = format(currentDate, "MMMM yyyy").toUpperCase()
    header.style.padding = "20px"
    header.style.margin = "0"
    header.style.fontSize = "24px"
    header.style.fontWeight = "300"
    header.style.textAlign = "center"
    header.style.textTransform = "uppercase"
    header.style.color = "#333"
    printableDiv.appendChild(header)

    const grid = document.createElement("div")
    grid.style.display = "grid"
    grid.style.gridTemplateColumns = "repeat(7, 1fr)"
    grid.style.border = "1px solid #eee"
    grid.style.borderBottom = "none"
    grid.style.borderRight = "none"
    grid.style.maxWidth = "1100px"
    grid.style.margin = "0 auto"

    const weekDaysPrintable = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    weekDaysPrintable.forEach((day) => {
      const dayHeader = document.createElement("div")
      dayHeader.textContent = day.toUpperCase()
      dayHeader.style.padding = "10px"
      dayHeader.style.textAlign = "center"
      dayHeader.style.borderBottom = "1px solid #eee"
      dayHeader.style.borderRight = "1px solid #eee"
      dayHeader.style.backgroundColor = "#f9f9f9"
      dayHeader.style.fontSize = "14px"
      dayHeader.style.color = "#666"
      grid.appendChild(dayHeader)
    })

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startingDayOfWeek = getDay(firstDayOfMonth)

    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyCell = document.createElement("div")
      emptyCell.style.borderBottom = "1px solid #eee"
      emptyCell.style.borderRight = "1px solid #eee"
      emptyCell.style.height = "120px"
      emptyCell.style.backgroundColor = "white"
      grid.appendChild(emptyCell)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayEvents = events.filter((event) => isSameDay(event.date, date))
      const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, date))
      const isWeekend = getDay(date) === 0 || getDay(date) === 6

      const dayCell = document.createElement("div")
      dayCell.style.position = "relative"
      dayCell.style.padding = "10px"
      dayCell.style.borderBottom = "1px solid #eee"
      dayCell.style.borderRight = "1px solid #eee"
      dayCell.style.height = "120px"
      dayCell.style.backgroundColor = isWeekend ? "#f9f9f9" : "white"

      const dayNumber = document.createElement("div")
      dayNumber.textContent = day.toString()
      dayNumber.style.position = "absolute"
      dayNumber.style.top = "5px"
      dayNumber.style.right = "10px"
      dayNumber.style.fontSize = "14px"
      dayNumber.style.color = "#999"
      dayCell.appendChild(dayNumber)

      const holidaysContainer = document.createElement("div")
      holidaysContainer.style.marginTop = "25px"
      dayHolidays.forEach((holiday) => {
        const holidayDiv = document.createElement("div")
        holidayDiv.textContent = holiday.name.toUpperCase()
        holidayDiv.style.fontSize = "9px"
        holidayDiv.style.textTransform = "uppercase"
        holidayDiv.style.letterSpacing = "0.05em"
        holidayDiv.style.color = "#666"
        holidayDiv.style.marginBottom = "3px"
        holidaysContainer.appendChild(holidayDiv)
      })
      dayCell.appendChild(holidaysContainer)

      const eventsContainer = document.createElement("div")
      eventsContainer.style.marginTop = dayHolidays.length > 0 ? "5px" : "15px"
      eventsContainer.style.display = "flex"
      eventsContainer.style.flexDirection = "column"
      eventsContainer.style.height = "calc(100% - 40px)" // Adjusted height calc slightly

      const activeGroupIds = new Set(projectGroups.filter(g => g.active).map(g => g.id));
      const activeDayEvents = dayEvents.filter(event => {
          const eventEffectiveId = event.projectId ?? 'default';
          return activeGroupIds.has(eventEffectiveId);
      });

      const limitedEvents = activeDayEvents.slice(0, 4)

       if (limitedEvents.length === 1) {
            eventsContainer.style.justifyContent = "center";
       } else if (limitedEvents.length === 2) {
            eventsContainer.style.justifyContent = "space-between";
       } else {
            eventsContainer.style.justifyContent = "flex-start";
       }

      const colorMap = colorOptions.reduce((acc, opt) => {
        const match = opt.bg.match(/#([0-9a-fA-F]{6})/);
        if (match) {
            acc[opt.value] = `#${match[1]}`;
        }
        return acc;
      }, {} as Record<string, string>);


      if (limitedEvents.length === 1) {
        const event = limitedEvents[0]
        const eventDiv = document.createElement("div")
        eventDiv.textContent = event.content
        eventDiv.style.fontSize = "11px"
        eventDiv.style.fontWeight = "500"
        eventDiv.style.wordBreak = "break-word"
        eventDiv.style.overflow = "hidden"
        eventDiv.style.maxWidth = "100%"
        eventDiv.style.textOverflow = "ellipsis"
        eventDiv.style.whiteSpace = "nowrap"
        eventDiv.style.color = event.color ? colorMap[event.color] || '#000000' : '#000000';
        eventsContainer.appendChild(eventDiv)

      } else if (limitedEvents.length === 2) {
        const topEventContainer = document.createElement("div")
        topEventContainer.style.flex = "1"
        topEventContainer.style.display = "flex"
        topEventContainer.style.alignItems = "flex-start"
        topEventContainer.style.overflow = "hidden";

        const event1 = limitedEvents[0]
        const eventDiv1 = document.createElement("div")
        eventDiv1.textContent = event1.content
        eventDiv1.style.fontSize = "11px"
        eventDiv1.style.fontWeight = "500"
        eventDiv1.style.wordBreak = "break-word"
        eventDiv1.style.overflow = "hidden"
        eventDiv1.style.maxWidth = "100%"
        eventDiv1.style.textOverflow = "ellipsis"
        eventDiv1.style.whiteSpace = "nowrap"
        eventDiv1.style.color = event1.color ? colorMap[event1.color] || '#000000' : '#000000';
        topEventContainer.appendChild(eventDiv1)
        eventsContainer.appendChild(topEventContainer)

        const divider = document.createElement("div")
        divider.style.height = "1px"
        divider.style.backgroundColor = "#eee"
        divider.style.width = "100%"
        eventsContainer.appendChild(divider)

        const bottomEventContainer = document.createElement("div")
        bottomEventContainer.style.flex = "1"
        bottomEventContainer.style.display = "flex"
        bottomEventContainer.style.alignItems = "flex-end"
        bottomEventContainer.style.overflow = "hidden";

        const event2 = limitedEvents[1]
        const eventDiv2 = document.createElement("div")
        eventDiv2.textContent = event2.content
        eventDiv2.style.fontSize = "11px"
        eventDiv2.style.fontWeight = "500"
        eventDiv2.style.wordBreak = "break-word"
        eventDiv2.style.overflow = "hidden"
        eventDiv2.style.maxWidth = "100%"
        eventDiv2.style.textOverflow = "ellipsis"
        eventDiv2.style.whiteSpace = "nowrap"
        eventDiv2.style.color = event2.color ? colorMap[event2.color] || '#000000' : '#000000';
        bottomEventContainer.appendChild(eventDiv2)
        eventsContainer.appendChild(bottomEventContainer)
      }

      dayCell.appendChild(eventsContainer)
      grid.appendChild(dayCell)
    }

    const cellsAdded = startingDayOfWeek + daysInMonth
    const cellsNeeded = 42 - cellsAdded

    for (let i = 0; i < cellsNeeded; i++) {
      const emptyCell = document.createElement("div")
      emptyCell.style.borderBottom = "1px solid #eee"
      emptyCell.style.borderRight = "1px solid #eee"
      emptyCell.style.height = "120px"
      emptyCell.style.backgroundColor = "white"
      grid.appendChild(emptyCell)
    }

    printableDiv.appendChild(grid)

    const bottomSpace = document.createElement("div")
    bottomSpace.style.height = "40px"
    printableDiv.appendChild(bottomSpace)

    document.body.appendChild(printableDiv)

    return printableDiv;
  };

  const handleDragOverEmpty = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDropOnEmpty = (e: React.DragEvent, emptyCellIndex: number) => {
      e.preventDefault();
      console.log("Dropped on empty cell index:", emptyCellIndex, " Need to calculate date.");
      setDraggedEvent(null);
      setDragOverDate(null);
  };

  const handleUpdateEventColor = (index: number, color: string) => {
      if (index >= eventsForSelectedDate.length || !selectedDate) return;

      const updatedEvents = [...eventsForSelectedDate];
      updatedEvents[index] = { ...updatedEvents[index], color: color };
      setEventsForSelectedDate(updatedEvents);

      setEvents(prevEvents => {
          const mainEventIndex = prevEvents.findIndex(ev => ev.id === updatedEvents[index].id);
          if (mainEventIndex !== -1) {
              const newMainEvents = [...prevEvents];
              newMainEvents[mainEventIndex] = { ...newMainEvents[mainEventIndex], color: color };
              return newMainEvents;
          }
          return prevEvents;
      });
  };


  const handleAddEvent = () => {
    if (!selectedDate) return;
    if (eventsForSelectedDate.length >= 4) return;

    const newEvent: Event = {
      id: Math.random().toString(36).substring(2, 11),
      date: selectedDate,
      content: "",
      color: "text-black",
      projectId: "default",
    }
    setEventsForSelectedDate((prev) => [...prev, newEvent])
    setNewlyAddedEventId(newEvent.id);

    setTimeout(() => {
       const textareas = eventModalRef.current?.querySelectorAll('textarea');
       if(textareas && textareas.length > 0) {
           textareas[textareas.length - 1].focus();
       }
    }, 50)

  }

  useEffect(() => {
    if (showResetConfirm) {
      setTimeout(() => {
        cancelResetButtonRef.current?.focus();
      }, 0);
    }
  }, [showResetConfirm])

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

  const renderCalendar = useCallback(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const activeGroupIds = new Set(projectGroups.filter(g => g.active).map(g => g.id));

    const days = [];
    let dayIterator = startDate;
    let cellIndex = 0;

    while (dayIterator <= endDate) {
      const currentDateInLoop = dayIterator;
      const isCurrentMonth = isSameMonth(currentDateInLoop, monthStart);
      const isTodayDate = isToday(currentDateInLoop);
      const isWeekend = getDay(currentDateInLoop) === 0 || getDay(currentDateInLoop) === 6;

      const dayEvents = events.filter(
        (event) => {
          const eventEffectiveId = event.projectId ?? 'default';
          return isSameDay(event.date, currentDateInLoop) && activeGroupIds.has(eventEffectiveId);
        }
      );
      const limitedEvents = dayEvents.slice(0, 4);
      const dayHolidays = holidays.filter((holiday) => isSameDay(holiday.date, currentDateInLoop));

      const rowIndex = Math.floor(cellIndex / 7);
      const colIndex = cellIndex % 7;
      const borderClasses = cn(
        'border-gray-300',
        rowIndex < 5 ? 'border-b' : '',
        colIndex < 6 ? 'border-r' : ''
      );

      days.push(
        <div
          key={currentDateInLoop.toString()}
          className={cn(
            'h-16 sm:h-20 md:h-24 transition-colors duration-100 ease-in-out bg-white overflow-hidden', // Added overflow-hidden
            'flex flex-col p-0.5 sm:p-1.5 min-w-0', // Reduced padding, added min-w-0
            borderClasses,
            isCurrentMonth ? 'hover:bg-gray-100' : '', // Ensure all current month days, including today, turn gray on hover
            !isCurrentMonth ? 'bg-gray-50' : '',
            isDragging ? 'cursor-grabbing' : (isCurrentMonth ? 'cursor-pointer' : 'cursor-default')
          )}
          onClick={() => isCurrentMonth && handleDayClick(currentDateInLoop)}
          onDragOver={(e) => isCurrentMonth && handleDragOver(currentDateInLoop, e)}
          onDrop={(e) => isCurrentMonth && handleDrop(e, currentDateInLoop)}
        >
          {isCurrentMonth && (
            <div className="flex justify-between items-start w-full min-h-[18px]">
              <div className="text-[9px] uppercase tracking-wider font-mono text-gray-500 pr-1"> {/* Removed truncation/shrinking */}
                 {dayHolidays.length > 0 ? dayHolidays[0].name : <span>&nbsp;</span>}
              </div>

              <div className={cn(
                "text-xs sm:text-sm font-medium",
                isTodayDate
                  ? "bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px]"
                  : "text-gray-600"
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
                   eventTextColor = 'text-black';
                }

                return (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(event, e)}
                    className={cn(
                      'block text-[9px] sm:text-[10px] font-medium rounded-[2px] cursor-grab',
                      eventTextColor,
                       event.projectId && projectGroups.find(g => g.id === event.projectId)
                          ? `${getBgFromTextColor(eventTextColor)}/15`
                          : ''
                    )}
                    title={event.content}
                  >
                    <div className="flex items-start">
                      <span className="mr-1">▪</span>
                      <span className={cn(
                         'break-words overflow-hidden',
                         limitedEvents.length === 1 ? 'line-clamp-4' :
                         limitedEvents.length === 2 ? 'line-clamp-2' :
                         'line-clamp-1'
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
    const cellsNeeded = 42 - cellsGenerated

    for (let i = 0; i < cellsNeeded; i++) {
      const totalCellIndex = cellsGenerated + i;
      const rowIndex = Math.floor(totalCellIndex / 7);
      const colIndex = totalCellIndex % 7;

      const borderClasses = cn(
        'border-gray-300',
        rowIndex < 5 ? 'border-b' : '',
        colIndex < 6 ? 'border-r' : ''
      );

      days.push(
        <div
          key={`empty-end-${i}`}
          className={cn(
            'h-16 sm:h-20 md:h-24 bg-white', // Match reverted base height
            borderClasses
            )}
          onDragOver={handleDragOverEmpty}
          onDrop={(e) => handleDropOnEmpty(e, i)}
        ></div>,
      );
    }

    return days;
  }, [currentDate, events, projectGroups, holidays, isDragging, handleDragStart, handleDayClick, handleDrop, handleDragOver]);

  return (
    <div className={cn(
      "flex flex-col h-full max-w-5xl mx-auto font-mono pt-8 pb-4",
      "bg-white"
    )}>
      {/* Top Buttons */}
        <div className="mx-1 sm:mx-6 md:mx-12">
          <div className="flex flex-row flex-nowrap justify-between w-full mb-4 items-center gap-2 sm:gap-4">
            {/* Right Aligned Button Group */}
            <div className="flex flex-nowrap gap-1.5 sm:gap-2 items-center">
              <button
                onClick={downloadCalendarAsImage}
                disabled={isDownloading}
                className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 sm:gap-1.5 px-2 py-1 border border-gray-200 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? '...' : <Camera size={14} />} {isDownloading ? 'GENERATING' : 'SCREENSHOT'}
              </button>
              <div className="relative">
                <button
                    onClick={() => {
                        setSelectedExportTags(projectGroups.map(g => g.id));
                        setShowExportOptionsModal(true);
                    }}
                    className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 sm:gap-1.5 px-2 py-1 border border-gray-200 rounded-sm transition-colors"
                >
                  <CalendarIcon size={14} /> EXPORT
                </button>
              </div>
              <button
                onClick={handleShare}
                className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 sm:gap-1.5 px-2 py-1 border border-gray-200 rounded-sm transition-colors"
              >
                <Link size={14} /> SHARE
              </button>
            </div>
            <button
              onClick={handleReset}
              className="text-[10px] sm:text-xs text-gray-500 font-mono hover:bg-gray-100 flex items-center gap-1 sm:gap-1.5 px-2 py-1 border border-gray-200 rounded-sm transition-colors"
            >
              <RefreshCcw size={14} /> RESET
            </button>
          </div>
        </div>


      {/* Calendar Container */}
      <div ref={calendarScreenshotContainerRef} className="bg-white border border-gray-300 shadow-sm mx-1 sm:mx-6 md:mx-12 overflow-hidden rounded-sm">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-gray-50 border-b border-gray-300">
          <button
            id="calendar-nav-left" // Correct ID for left arrow
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="text-sm text-gray-400 hover:bg-gray-100 active:bg-gray-200 p-1 sm:p-1.5 rounded-sm w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          <div className="relative date-selector-container">
            <button
              onClick={() => setShowDateSelector(!showDateSelector)}
              className="text-base sm:text-lg font-bold font-mono tracking-tight hover:cursor-pointer hover:underline text-black"
            >
            <div className="text-xl font-mono tracking-tight text-center">
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
            id="calendar-nav-right" // ID for right arrow
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
                  key={day}
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

      {/* Project Groups Panel */}
      <div className="w-full flex justify-center px-2 sm:px-0">
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

      {/* Event Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40"
          onClick={(e) => {
            if (e.target === e.currentTarget && modalCloseState === 'idle') {
              handleCancelEdit();
            }
          }}
        >
           <div ref={eventModalRef} className="bg-white rounded-sm w-full max-w-md">
            {/* Modal Header - Removed border */} 
            <div className="p-6"> {/* Removed border-b border-gray-200 */} 
              <div className="flex items-center justify-center"> 
                <div> 
                  <h3 className="text-lg font-mono">EDIT {format(selectedDate, "MMMM d, yyyy").toUpperCase()}</h3>
                  {holidayForSelectedDate && (
                    <p className="text-xs text-gray-500 font-mono mt-1 text-center">{holidayForSelectedDate.toUpperCase()}</p>)}
                </div>
              </div>
            </div>

            {/* Modal Content */} 
            <div className="p-6"> {/* Removed border-t */} 
              {eventsForSelectedDate.map((event, index) => (
                <div
                  key={event.id}
                  className={cn(
                    "mb-6 last:mb-0 transition-all duration-300 ease-in-out overflow-hidden",
                    event.id === newlyAddedEventId
                      ? "opacity-0 max-h-0"
                      : "opacity-100 max-h-[200px]"
                  )}
                >
                  <div className="relative">
                    <textarea
                      ref={index === 0 ? firstEventInputRef : eventInputRef}
                      value={event.content}
                      onChange={(e) => handleUpdateEventContent(index, e.target.value)}
                      onKeyDown={(e) => handleTextareaKeyDown(e, index)}
                      onSelect={(e: React.MouseEvent<HTMLTextAreaElement> | React.TouchEvent<HTMLTextAreaElement>) => handleTextSelect(e)}
                      placeholder="event"
                      className={`w-full p-3 border rounded-sm ${getTextColorClass(event.color)} focus:outline-none focus:border-black font-mono resize-none h-[72px] pr-8`}
                      style={{ textTransform: 'none', fontFamily: 'inherit' }}
                    />
                  </div>

                  {/* Tag Selection and Delete Button Container with transition */}
                  <div
                    className={cn(
                      "flex flex-wrap gap-2 items-center transition-all duration-300 ease-in-out overflow-hidden",
                      event.content.trim() !== ''
                        ? "opacity-100 max-h-40 mb-2"
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
                              if (clickedGroupId !== currentProjectId) {
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
                      onClick={() => {
                        if (eventsForSelectedDate.length > 1) {
                          const updatedEvents = eventsForSelectedDate.filter((_, i) => i !== index);
                          setEventsForSelectedDate(updatedEvents);
                        } else {
                          const updatedEvents = [...eventsForSelectedDate];
                          updatedEvents[index].content = ""; 
                          setEventsForSelectedDate(updatedEvents);
                        }
                        setTimeout(() => firstEventInputRef.current?.focus(), 0); 
                      }}
                      className="text-red-600 hover:text-red-600 hover:underline self-start bg-transparent focus:outline-none border-none hover:bg-transparent"
                    >
                      DELETE
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer - Stacked layout */}
            <div className="p-0">
              <Button
                variant="ghost"
                onClick={handleAddEvent}
                disabled={modalCloseState !== 'idle' || eventsForSelectedDate.length >= 4}
                className="w-[calc(100%-3rem)] mx-6 mb-4 border border-dotted border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center py-2 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ADD ANOTHER EVENT
              </Button>
            </div>
            <div className="flex justify-end gap-2 p-4">
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
      )}

      {/* Share Modal */}
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

      {/* Google Calendar Instructions Modal */}
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
              <li>Click "Import & Export"</li>
              <li>Upload the downloaded .ics file</li>
              <li>Click "Import"</li>
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

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResetConfirm(false);
            }
          }}
        >
          <div className="bg-white rounded-sm w-full max-w-sm p-6">
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmId && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
           <div ref={deleteConfirmRef} className="bg-white p-6 rounded-sm max-w-sm w-full shadow-xl">
             <h4 className="text-md font-mono mb-2 text-center">DELETE</h4>
             <p className="text-xs font-mono text-gray-600 mb-6 text-center">
               Are you sure you want to delete the tag "{projectGroups.find(g => g.id === showDeleteConfirmId)?.name}"? Events using this tag will revert to default.
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

      {/* Export Options Modal */}
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
             {/* Header */}
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

             {/* Export Target Selection */}
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
                     <p className="text-xs text-gray-500 font-mono mt-1 ml-6">Note: An .ics file will be downloaded. You'll need to import it into Google Calendar manually.</p>
                   )}
                 </div>
               </div>
             </div>

             {/* Tag Selection */}
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

             {/* Action Buttons */}
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
             </div> {/* End Action Buttons */}
           </div> {/* End Modal Content */}
         </div>
      )}

    </div>
  )
}

