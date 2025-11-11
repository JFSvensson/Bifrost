/**
 * Natural Language Parser for Todos
 * Parses input like "Möt Anna imorgon 14:00 #arbete [!high]" into structured todo data
 */

export class NaturalLanguageParser {
    constructor() {
        // Date patterns (Swedish)
        this.datePatterns = {
            today: /\b(idag|today)\b/i,
            tomorrow: /\b(imorgon|imorn|tomorrow)\b/i,
            yesterday: /\b(igår|yesterday)\b/i,
            
            // Weekdays
            monday: /\b(måndag|monday|mån)\b/i,
            tuesday: /\b(tisdag|tuesday|tis)\b/i,
            wednesday: /\b(onsdag|wednesday|ons)\b/i,
            thursday: /\b(torsdag|thursday|tors?)\b/i,
            friday: /\b(fredag|friday|fre)\b/i,
            saturday: /\b(lördag|saturday|lör)\b/i,
            sunday: /\b(söndag|sunday|sön)\b/i,
            
            // Relative dates
            nextWeek: /\b(nästa vecka|next week)\b/i,
            nextMonth: /\b(nästa månad|next month)\b/i,
            
            // Specific date formats
            isoDate: /\b(\d{4}-\d{2}-\d{2})\b/,
            slashDate: /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/,
            dotDate: /\b(\d{1,2}\.\d{1,2}(?:\.\d{2,4})?)\b/,
            
            // Relative with number
            inDays: /\bom (\d+) dag(?:ar)?\b/i,
            inWeeks: /\bom (\d+) veck(?:a|or)\b/i
        };
        
        // Time patterns
        this.timePatterns = {
            hourMinute: /\b(\d{1,2}):(\d{2})\b/,
            hourOnly: /\bkl\.?\s*(\d{1,2})\b/i,
            ampm: /\b(\d{1,2})\s*(am|pm)\b/i
        };
        
        // Priority patterns
        this.priorityPatterns = {
            high: /\[!high\]|🔥|‼️/i,
            medium: /\[!medium\]|⚠️/i,
            low: /\[!low\]|🔽/i
        };
        
        // Recurring patterns (Swedish)
        this.recurringPatterns = {
            // Daily
            daily: /\b(varje dag|every day|dagligen)\b/i,
            everyNDays: /\b(?:var|every)\s+(\d+)(?::e|nd|rd|th)?\s+dag(?:ar|s)?\b/i,
            
            // Weekly
            weekly: /\b(varje vecka|every week|veckovis)\b/i,
            everyNWeeks: /\b(?:var(?:annan)?|every)\s+(\d+)(?::e|nd|rd|th)?\s+veck(?:a|or?|s)?\b/i,
            everyWeekday: /\b(?:varje|every)\s+(måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
            everyWeekdays: /\b(?:varje|every)\s+((?:måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+och\s+|\s+and\s+|,\s*)+(?:måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag|monday|tuesday|wednesday|thursday|friday|saturday|sunday))+\b/i,
            
            // Monthly
            monthly: /\b(varje månad|every month|månadsvis)\b/i,
            everyNMonths: /\b(?:var|every)\s+(\d+)(?::e|nd|rd|th)?\s+månad(?:er|s)?\b/i,
            monthlyDay: /\b(?:varje|every)\s+(?:månad|month)\s+(?:den|the)\s+(\d{1,2})(?::e|st|nd|rd|th)?\b/i
        };
        
        // Tag pattern
        this.tagPattern = /#(\w+)/g;
        
        // Source indicator
        this.sourcePattern = /@(\w+)/g;
    }
    
    /**
     * Parse natural language input into structured todo
     */
    parse(input) {
        if (!input || typeof input !== 'string') {
            return null;
        }
        
        const result = {
            text: input,
            dueDate: null,
            dueTime: null,
            tags: [],
            priority: 'normal',
            source: 'bifrost',
            rawInput: input,
            recurring: null  // Will be populated if recurring pattern found
        };
        
        // Extract and remove recurring pattern first
        const recurring = this.extractRecurring(input);
        if (recurring) {
            result.recurring = recurring;
            input = input.replace(recurring.matched, '').trim();
        }
        
        // Extract and remove tags
        const tags = this.extractTags(input);
        if (tags.length > 0) {
            result.tags = tags;
            input = input.replace(this.tagPattern, '').trim();
        }
        
        // Extract and remove priority
        const priority = this.extractPriority(input);
        if (priority) {
            result.priority = priority;
            input = input.replace(/\[!(?:high|medium|low)\]|🔥|⚠️|🔽|‼️/gi, '').trim();
        }
        
        // Extract and remove source
        const source = this.extractSource(input);
        if (source) {
            result.source = source;
            input = input.replace(this.sourcePattern, '').trim();
        }
        
        // Extract time (before date to avoid confusion)
        const time = this.extractTime(input);
        if (time) {
            result.dueTime = time.formatted;
            input = input.replace(time.matched, '').trim();
        }
        
        // Extract date
        const date = this.extractDate(input);
        if (date) {
            result.dueDate = date.formatted;
            input = input.replace(date.matched, '').trim();
        }
        
        // Clean up text
        result.text = input
            .replace(/\s+/g, ' ')  // Multiple spaces → single space
            .trim();
        
        return result;
    }
    
    /**
     * Extract tags from input
     */
    extractTags(input) {
        const tags = [];
        let match;
        
        while ((match = this.tagPattern.exec(input)) !== null) {
            tags.push(match[1]);
        }
        
        return tags;
    }
    
    /**
     * Extract priority from input
     */
    extractPriority(input) {
        if (this.priorityPatterns.high.test(input)) return 'high';
        if (this.priorityPatterns.medium.test(input)) return 'medium';
        if (this.priorityPatterns.low.test(input)) return 'low';
        return null;
    }
    
    /**
     * Extract source from input
     */
    extractSource(input) {
        const match = this.sourcePattern.exec(input);
        return match ? match[1] : null;
    }
    
    /**
     * Extract recurring pattern from input
     */
    extractRecurring(input) {
        // Daily patterns
        let match = input.match(this.recurringPatterns.daily);
        if (match) {
            return {
                type: 'daily',
                frequency: 1,
                matched: match[0]
            };
        }
        
        match = input.match(this.recurringPatterns.everyNDays);
        if (match) {
            return {
                type: 'daily',
                frequency: parseInt(match[1]),
                matched: match[0]
            };
        }
        
        // Weekly patterns with specific days
        match = input.match(this.recurringPatterns.everyWeekday);
        if (match) {
            const dayMap = {
                'måndag': 1, 'monday': 1,
                'tisdag': 2, 'tuesday': 2,
                'onsdag': 3, 'wednesday': 3,
                'torsdag': 4, 'thursday': 4,
                'fredag': 5, 'friday': 5,
                'lördag': 6, 'saturday': 6,
                'söndag': 0, 'sunday': 0
            };
            
            const dayName = match[1].toLowerCase();
            const dayOfWeek = dayMap[dayName];
            
            return {
                type: 'weekly',
                frequency: 1,
                daysOfWeek: [dayOfWeek],
                matched: match[0]
            };
        }
        
        // Weekly pattern (general)
        match = input.match(this.recurringPatterns.weekly);
        if (match) {
            return {
                type: 'weekly',
                frequency: 1,
                matched: match[0]
            };
        }
        
        match = input.match(this.recurringPatterns.everyNWeeks);
        if (match) {
            return {
                type: 'weekly',
                frequency: parseInt(match[1]),
                matched: match[0]
            };
        }
        
        // Monthly patterns
        match = input.match(this.recurringPatterns.monthlyDay);
        if (match) {
            return {
                type: 'monthly',
                frequency: 1,
                dayOfMonth: parseInt(match[1]),
                matched: match[0]
            };
        }
        
        match = input.match(this.recurringPatterns.monthly);
        if (match) {
            return {
                type: 'monthly',
                frequency: 1,
                dayOfMonth: 1,
                matched: match[0]
            };
        }
        
        match = input.match(this.recurringPatterns.everyNMonths);
        if (match) {
            return {
                type: 'monthly',
                frequency: parseInt(match[1]),
                dayOfMonth: 1,
                matched: match[0]
            };
        }
        
        return null;
    }
    
    /**
     * Extract time from input
     */
    extractTime(input) {
        // HH:MM format
        let match = input.match(this.timePatterns.hourMinute);
        if (match) {
            const [full, hour, minute] = match;
            return {
                formatted: `${hour.padStart(2, '0')}:${minute}`,
                matched: full,
                hour: parseInt(hour),
                minute: parseInt(minute)
            };
        }
        
        // Hour only (kl. 14)
        match = input.match(this.timePatterns.hourOnly);
        if (match) {
            const hour = parseInt(match[1]);
            return {
                formatted: `${hour.toString().padStart(2, '0')}:00`,
                matched: match[0],
                hour,
                minute: 0
            };
        }
        
        // AM/PM format
        match = input.match(this.timePatterns.ampm);
        if (match) {
            let hour = parseInt(match[1]);
            const ampm = match[2].toLowerCase();
            
            if (ampm === 'pm' && hour < 12) hour += 12;
            if (ampm === 'am' && hour === 12) hour = 0;
            
            return {
                formatted: `${hour.toString().padStart(2, '0')}:00`,
                matched: match[0],
                hour,
                minute: 0
            };
        }
        
        return null;
    }
    
    /**
     * Extract date from input
     */
    extractDate(input) {
        const today = new Date();
        
        // Today
        if (this.datePatterns.today.test(input)) {
            return {
                formatted: this.formatDate(today),
                matched: input.match(this.datePatterns.today)[0],
                date: today
            };
        }
        
        // Tomorrow
        if (this.datePatterns.tomorrow.test(input)) {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return {
                formatted: this.formatDate(tomorrow),
                matched: input.match(this.datePatterns.tomorrow)[0],
                date: tomorrow
            };
        }
        
        // Yesterday
        if (this.datePatterns.yesterday.test(input)) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return {
                formatted: this.formatDate(yesterday),
                matched: input.match(this.datePatterns.yesterday)[0],
                date: yesterday
            };
        }
        
        // Weekdays (next occurrence)
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        for (let i = 0; i < weekdays.length; i++) {
            const pattern = this.datePatterns[weekdays[i]];
            if (pattern.test(input)) {
                const targetDay = i;
                const currentDay = today.getDay();
                let daysUntil = targetDay - currentDay;
                
                if (daysUntil <= 0) daysUntil += 7; // Next week
                
                const targetDate = new Date(today);
                targetDate.setDate(targetDate.getDate() + daysUntil);
                
                return {
                    formatted: this.formatDate(targetDate),
                    matched: input.match(pattern)[0],
                    date: targetDate
                };
            }
        }
        
        // Next week (7 days from now)
        if (this.datePatterns.nextWeek.test(input)) {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            return {
                formatted: this.formatDate(nextWeek),
                matched: input.match(this.datePatterns.nextWeek)[0],
                date: nextWeek
            };
        }
        
        // Next month
        if (this.datePatterns.nextMonth.test(input)) {
            const nextMonth = new Date(today);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return {
                formatted: this.formatDate(nextMonth),
                matched: input.match(this.datePatterns.nextMonth)[0],
                date: nextMonth
            };
        }
        
        // In X days
        let match = input.match(this.datePatterns.inDays);
        if (match) {
            const days = parseInt(match[1]);
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + days);
            return {
                formatted: this.formatDate(targetDate),
                matched: match[0],
                date: targetDate
            };
        }
        
        // In X weeks
        match = input.match(this.datePatterns.inWeeks);
        if (match) {
            const weeks = parseInt(match[1]);
            const targetDate = new Date(today);
            targetDate.setDate(targetDate.getDate() + (weeks * 7));
            return {
                formatted: this.formatDate(targetDate),
                matched: match[0],
                date: targetDate
            };
        }
        
        // ISO date (YYYY-MM-DD)
        match = input.match(this.datePatterns.isoDate);
        if (match) {
            const date = new Date(match[1]);
            if (!isNaN(date.getTime())) {
                return {
                    formatted: match[1],
                    matched: match[0],
                    date
                };
            }
        }
        
        // Slash date (DD/MM or DD/MM/YYYY)
        match = input.match(this.datePatterns.slashDate);
        if (match) {
            const parts = match[1].split('/');
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // 0-indexed
            const year = parts[2] ? parseInt(parts[2]) : today.getFullYear();
            
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return {
                    formatted: this.formatDate(date),
                    matched: match[0],
                    date
                };
            }
        }
        
        // Dot date (DD.MM or DD.MM.YYYY)
        match = input.match(this.datePatterns.dotDate);
        if (match) {
            const parts = match[1].split('.');
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parts[2] ? parseInt(parts[2]) : today.getFullYear();
            
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return {
                    formatted: this.formatDate(date),
                    matched: match[0],
                    date
                };
            }
        }
        
        return null;
    }
    
    /**
     * Format date as YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Get suggestions for partial input
     */
    getSuggestions(input) {
        if (!input) return [];
        
        const suggestions = [];
        const lower = input.toLowerCase();
        
        // Date suggestions
        if (lower.includes('ida') || lower.includes('tod')) {
            suggestions.push({ type: 'date', text: 'idag', value: 'today' });
        }
        if (lower.includes('imo') || lower.includes('tom')) {
            suggestions.push({ type: 'date', text: 'imorgon', value: 'tomorrow' });
        }
        
        // Weekday suggestions
        const weekdays = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'];
        weekdays.forEach(day => {
            if (day.startsWith(lower) || day.includes(lower)) {
                suggestions.push({ type: 'date', text: day, value: day });
            }
        });
        
        // Priority suggestions
        if (lower.includes('hög') || lower.includes('high')) {
            suggestions.push({ type: 'priority', text: '[!high]', value: 'high' });
        }
        if (lower.includes('med') || lower.includes('medium')) {
            suggestions.push({ type: 'priority', text: '[!medium]', value: 'medium' });
        }
        
        return suggestions.slice(0, 5); // Max 5 suggestions
    }
    
    /**
     * Validate parsed result
     */
    validate(parsed) {
        const errors = [];
        
        if (!parsed.text || parsed.text.length === 0) {
            errors.push('Text is required');
        }
        
        if (parsed.dueDate) {
            const date = new Date(parsed.dueDate);
            if (isNaN(date.getTime())) {
                errors.push('Invalid date format');
            }
        }
        
        if (parsed.dueTime && !/^\d{2}:\d{2}$/.test(parsed.dueTime)) {
            errors.push('Invalid time format (expected HH:MM)');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Export singleton instance
export const naturalLanguageParser = new NaturalLanguageParser();
