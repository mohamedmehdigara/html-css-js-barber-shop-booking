document.addEventListener('DOMContentLoaded', function() {
    // --- DATA SIMULATION ---
    const SERVICES = [
        { id: 'haircut', name: 'Standard Haircut', price: 30, duration: 45, tags: ['cut', 'classic'] },
        { id: 'beard-trim', name: 'Beard Trim', price: 20, duration: 30, tags: ['beard', 'styling'] },
        { id: 'haircut-beard', name: 'Haircut & Beard Trim', price: 50, duration: 75, tags: ['cut', 'beard'] },
        { id: 'shave', name: 'Hot Towel Shave', price: 40, duration: 60, tags: ['shave'] }
    ];

    const BARBERS = [
        { id: 'albert', name: 'Albert', shift: ['09:00', '17:00'], bio: "Albert is our master of fades and classic cuts. 10 years experience.", specialties: ['cut', 'classic'] },
        { id: 'ben', name: 'Ben', shift: ['10:00', '18:00'], bio: "Ben specializes in modern styling and detailed beard shaping.", specialties: ['cut', 'beard', 'styling'] },
        { id: 'charles', name: 'Charles', shift: ['11:00', '19:00'], bio: "Charles is known for his signature hot towel shaves and artistic designs.", specialties: ['shave', 'classic'] }
    ];

    // Simulated Bookings: (BarberID, Date, Time)
    const SIMULATED_BOOKINGS = [
        { barber: 'albert', date: getTodayDateString(), time: '10:00' },
        { barber: 'ben', date: getTomorrowDateString(), time: '14:30' }
    ];
    
    // CONSTANTS
    const BOOKING_BUFFER_MINUTES = 60;
    const MAX_BOOKING_DAYS_AHEAD = 30;

    // --- DOM Elements ---
    const body = document.body;
    const modeToggleBtn = document.getElementById('mode-toggle');
    const bookingForm = document.getElementById('booking-form');
    const stepIndicators = document.querySelectorAll('.indicator');
    const steps = {
        1: document.getElementById('step-1'),
        2: document.getElementById('step-2'),
        3: document.getElementById('step-3')
    };

    const serviceSelect = document.getElementById('service');
    const barberSelect = document.getElementById('barber');
    const dateInput = document.getElementById('date');
    const timeContainer = document.getElementById('time-slots-container');
    const nextStep2Btn = document.getElementById('next-step-2');
    const nextStep3Btn = document.getElementById('next-step-3');
    const dayWarning = document.getElementById('day-warning');
    const viewBioBtn = document.getElementById('view-barber-bio');
    const barberModal = document.getElementById('barber-modal');
    const nameInput = document.getElementById('name');
    const nameFeedbackIcon = document.getElementById('name-feedback');
    const submitCheckBtn = document.getElementById('submit-check');
    const filterHint = document.getElementById('filter-hint');
    const statusAnnouncer = document.getElementById('status-announcer');
    
    // The session timeout modal and buttons are removed from the DOM and script.

    // --- State Management & Local Storage ---
    let selectedSlot = null;
    let selectedService = null;
    let selectedBarber = null;
    let currentStep = 1;

    // --- UTILITY FUNCTIONS ---

    function getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }
    
    function getTomorrowDateString() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }
    
    function getMaxDateString() {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + MAX_BOOKING_DAYS_AHEAD);
        return maxDate.toISOString().split('T')[0];
    }
    
    function announceStatus(message) {
        statusAnnouncer.textContent = message;
    }

    // Calculates the estimated end time (Used in Step 3)
    function calculateEndTime(startTime, durationMinutes) {
        if (!startTime || !durationMinutes) return '--:--';
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        
        // Use a base date for calculation
        const baseDate = new Date(getTodayDateString()); 
        baseDate.setHours(startHour, startMinute, 0, 0);
        
        const endTimeMs = baseDate.getTime() + durationMinutes * 60000;
        const endTime = new Date(endTimeMs);
        
        return ('0' + endTime.getHours()).slice(-2) + ':' + ('0' + endTime.getMinutes()).slice(-2);
    }

    // Local Storage Persistence (Simulated Cart)
    function saveStateToLocalStorage() {
        const state = {
            serviceId: serviceSelect.value,
            barberId: barberSelect.value,
            date: dateInput.value,
            time: selectedSlot
        };
        localStorage.setItem('barberBookingState', JSON.stringify(state));
    }

    function loadStateFromLocalStorage() {
        const savedState = localStorage.getItem('barberBookingState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            if (state.barberId) {
                barberSelect.value = state.barberId;
                updateBarberSpecialties(state.barberId); 
            }
            if (state.serviceId) {
                serviceSelect.value = state.serviceId;
            }
            dateInput.value = state.date;
            selectedSlot = state.time;
            
            updateSelections(true); 
            
            if (currentStep === 2 && state.date) {
                validateDateAndGenerateSlots();
                setTimeout(() => {
                    const slotEl = timeContainer.querySelector(`[data-time="${selectedSlot}"]`);
                    if (slotEl && !slotEl.classList.contains('booked') && !slotEl.classList.contains('disabled')) {
                        slotEl.classList.add('selected');
                        nextStep3Btn.disabled = false;
                    }
                }, 50);
            }
        }
    }

    function setStepIndicator(stepNum) {
        currentStep = stepNum;
        stepIndicators.forEach(indicator => {
            const indicatorStep = parseInt(indicator.dataset.step);
            
            indicator.setAttribute('aria-selected', indicatorStep === stepNum);
            
            indicator.classList.remove('active', 'complete');
            if (indicatorStep === stepNum) {
                indicator.classList.add('active');
            } else if (indicatorStep < stepNum) {
                indicator.classList.add('complete');
            }
        });
        
        announceStatus(`Now on step ${stepNum}`);
    }

    // Dark Mode Toggle
    function toggleMode() {
        const isDarkMode = body.classList.toggle('dark-mode');
        localStorage.setItem('barberAppMode', isDarkMode ? 'dark' : 'light');
        const modeText = isDarkMode ? 'Light Mode' : 'Dark Mode';
        modeToggleBtn.innerHTML = isDarkMode 
            ? '<i class="fas fa-sun"></i> ' + modeText 
            : '<i class="fas fa-moon"></i> ' + modeText;
        announceStatus(`Switched to ${modeText}`);
    }

    // --- INITIALIZATION ---
    
    // Apply saved theme preference
    if (localStorage.getItem('barberAppMode') === 'dark') {
        body.classList.add('dark-mode');
        modeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        body.classList.remove('dark-mode');
        modeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
    modeToggleBtn.addEventListener('click', toggleMode);

    dateInput.min = getTodayDateString();
    dateInput.max = getMaxDateString();

    BARBERS.forEach(barber => {
        const option = document.createElement('option');
        option.value = barber.id;
        option.textContent = barber.name;
        barberSelect.appendChild(option);
    });
    setStepIndicator(1);
    
    updateServiceDropdown(SERVICES);
    
    loadStateFromLocalStorage();

    // --- MODAL LOGIC (Barber Bio) ---
    viewBioBtn.addEventListener('click', () => {
        if (selectedBarber) {
            document.getElementById('modal-barber-name').textContent = selectedBarber.name;
            document.getElementById('modal-barber-bio').textContent = selectedBarber.bio;
            document.getElementById('modal-barber-hours').textContent = `${selectedBarber.shift[0]} - ${selectedBarber.shift[1]}`;
            barberModal.classList.remove('hidden');
            announceStatus(`Viewing profile for ${selectedBarber.name}`);
        }
    });

    document.querySelector('.close-button').addEventListener('click', () => {
        barberModal.classList.add('hidden');
    });

    window.addEventListener('click', (event) => {
        if (event.target === barberModal) {
            barberModal.classList.add('hidden');
        }
    });

    // --- STEP NAVIGATION ---

    function showStep(stepNumber) {
        Object.keys(steps).forEach(key => {
            steps[key].classList.add('hidden');
        });
        steps[stepNumber].classList.remove('hidden');
        setStepIndicator(stepNumber);
        
        // Set focus for accessibility
        const firstInput = steps[stepNumber].querySelector('input, select, button:not([disabled])');
        if (firstInput) {
            firstInput.focus();
        }
    }

    document.getElementById('next-step-2').addEventListener('click', () => {
        if (!selectedService || !selectedBarber) return;
        showStep(2);
        validateDateAndGenerateSlots();
    });

    document.getElementById('prev-step-1').addEventListener('click', () => {
        showStep(1);
    });

    document.getElementById('next-step-3').addEventListener('click', () => {
        if (!selectedSlot) return;
        
        // Update summary in Step 3
        const endTime = calculateEndTime(selectedSlot, selectedService.duration);
        const totalPrice = `$${selectedService.price}`;
        
        document.getElementById('summary-barber').textContent = selectedBarber.name;
        document.getElementById('summary-service').textContent = selectedService.name;
        document.getElementById('summary-date').textContent = dateInput.value;
        document.getElementById('summary-time').textContent = selectedSlot;
        document.getElementById('summary-end-time').textContent = endTime;
        document.getElementById('summary-total-price').textContent = totalPrice;
        
        showStep(3);
        saveStateToLocalStorage();
    });

    document.getElementById('prev-step-2').addEventListener('click', () => {
        showStep(2);
    });
    
    // --- STEP 1 LOGIC (Service & Barber) ---

    // Dynamic Service Filtering
    function updateServiceDropdown(services) {
        serviceSelect.innerHTML = '<option value="">Select a service</option>';
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = `${service.name} ($${service.price} - ${service.duration} min)`;
            serviceSelect.appendChild(option);
        });
    }

    function updateBarberSpecialties(barberId) {
        selectedBarber = BARBERS.find(b => b.id === barberId);
        
        if (selectedBarber) {
            const filteredServices = SERVICES.filter(service => 
                service.tags.some(tag => selectedBarber.specialties.includes(tag))
            );
            updateServiceDropdown(filteredServices);
            filterHint.classList.remove('hidden');
            announceStatus(`Service list filtered by ${selectedBarber.name}'s specialties.`);
        } else {
            // If no barber selected, show all services
            updateServiceDropdown(SERVICES);
            filterHint.classList.add('hidden');
            announceStatus(`Showing all services.`);
        }
    }

    function updateSelections() {
        const serviceId = serviceSelect.value;
        const barberId = barberSelect.value;
        
        // Update service filter logic only if barber changes
        if (barberId) {
            updateBarberSpecialties(barberId);
        } else {
             updateServiceDropdown(SERVICES);
             filterHint.classList.add('hidden');
        }

        selectedService = SERVICES.find(s => s.id === serviceId);
        selectedBarber = BARBERS.find(b => b.id === barberId);

        const detailsBox = document.getElementById('service-details');

        if (selectedService) {
            document.getElementById('detail-price').textContent = `$${selectedService.price}`;
            document.getElementById('detail-duration').textContent = `${selectedService.duration} minutes`;
            detailsBox.classList.remove('hidden');
        } else {
            detailsBox.classList.add('hidden');
        }

        viewBioBtn.classList.toggle('hidden', !selectedBarber);
        viewBioBtn.disabled = !selectedBarber;

        nextStep2Btn.disabled = !(selectedService && selectedBarber);
        
        if (currentStep === 1 || currentStep === 2) {
             selectedSlot = null;
             nextStep3Btn.disabled = true;
             validateDateAndGenerateSlots();
        }
        saveStateToLocalStorage();
    }

    serviceSelect.addEventListener('change', updateSelections);
    barberSelect.addEventListener('change', updateSelections);

    // --- STEP 2 LOGIC (Date & Time) ---
    
    function validateDateAndGenerateSlots() {
        const bookingDateString = dateInput.value;
        if (!bookingDateString || !selectedBarber || !selectedService) {
            dayWarning.classList.add('hidden');
            timeContainer.innerHTML = '<p class="placeholder-text">Please select a service, barber, and date.</p>';
            nextStep3Btn.disabled = true;
            return;
        }

        const bookingDate = new Date(bookingDateString);
        bookingDate.setHours(0, 0, 0, 0); 

        // Check for Saturday (Saturday is 6)
        if (bookingDate.getDay() === 6) {
            dayWarning.classList.remove('hidden');
            timeContainer.innerHTML = '<p class="placeholder-text">No bookings available on Saturdays.</p>';
            nextStep3Btn.disabled = true;
            announceStatus("Cannot book on Saturday. Please select another day.");
            return;
        } else {
            dayWarning.classList.add('hidden');
        }

        generateTimeSlots(bookingDateString);
    }

    function generateTimeSlots(bookingDateString) {
        const duration = selectedService.duration;
        const [startHour, startMinute] = selectedBarber.shift[0].split(':').map(Number);
        const [endHour, endMinute] = selectedBarber.shift[1].split(':').map(Number);
        
        timeContainer.innerHTML = '';
        let availableSlotsExist = false;
        
        const now = new Date();
        
        let currentTime = new Date(bookingDateString);
        currentTime.setHours(startHour, startMinute, 0, 0);
        
        const endTime = new Date(bookingDateString);
        endTime.setHours(endHour, endMinute, 0, 0);

        while (currentTime.getTime() + duration * 60000 <= endTime.getTime()) {
            const slotStart = ('0' + currentTime.getHours()).slice(-2) + ':' + ('0' + currentTime.getMinutes()).slice(-2);
            
            const isBooked = SIMULATED_BOOKINGS.some(booking => 
                booking.barber === selectedBarber.id && 
                booking.date === bookingDateString && 
                booking.time === slotStart
            );
            
            const slotStartTimeMs = currentTime.getTime();
            const isToday = bookingDateString === getTodayDateString();
            const bufferTimeMs = now.getTime() + BOOKING_BUFFER_MINUTES * 60000;
            const isTooSoon = isToday && (slotStartTimeMs < bufferTimeMs);
            
            const slotEl = document.createElement('div');
            slotEl.classList.add('time-slot');
            slotEl.textContent = slotStart;
            slotEl.dataset.time = slotStart;

            if (isBooked) {
                slotEl.classList.add('booked');
                slotEl.setAttribute('aria-label', `Slot at ${slotStart} is booked.`);
            } else if (isTooSoon) {
                 slotEl.classList.add('disabled');
                 slotEl.setAttribute('aria-label', `Slot at ${slotStart} is too soon to book.`);
            } else {
                availableSlotsExist = true;
                slotEl.setAttribute('tabindex', '0'); 
                slotEl.setAttribute('role', 'button');
                slotEl.setAttribute('aria-label', `Select time slot ${slotStart}`);
                slotEl.addEventListener('click', handleSlotSelection);
                slotEl.addEventListener('keydown', (e) => { 
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSlotSelection(e);
                    }
                });
                
                if (slotStart === selectedSlot) {
                     slotEl.classList.add('selected');
                     nextStep3Btn.disabled = false;
                }
            }
            
            timeContainer.appendChild(slotEl);

            currentTime = new Date(currentTime.getTime() + duration * 60000);
        }

        if (!availableSlotsExist) {
            timeContainer.innerHTML = '<p class="placeholder-text">No available slots for this combination. Try another date or barber.</p>';
            announceStatus("No time slots available.");
        } else {
            announceStatus("Time slots successfully loaded.");
        }
    }

    function handleSlotSelection(event) {
        // Deselect previous slot
        const previouslySelected = timeContainer.querySelector('.time-slot.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
            previouslySelected.setAttribute('aria-selected', 'false');
        }

        // Select new slot
        const newSlot = event.currentTarget;
        newSlot.classList.add('selected');
        newSlot.setAttribute('aria-selected', 'true');
        selectedSlot = newSlot.dataset.time;
        nextStep3Btn.disabled = false;
        saveStateToLocalStorage();
        announceStatus(`Time slot selected: ${selectedSlot}`);
    }

    dateInput.addEventListener('change', () => {
        selectedSlot = null;
        validateDateAndGenerateSlots();
        saveStateToLocalStorage();
    });
    
    // --- STEP 3 LOGIC (Instant Feedback & Confirmation) ---
    
    // Instant Input Feedback
    nameInput.addEventListener('input', () => {
        if (nameInput.value.trim().length > 1) {
            nameFeedbackIcon.classList.remove('hidden');
        } else {
            nameFeedbackIcon.classList.add('hidden');
        }
    });

    // Client-Side Confirmation Dialog (Pre-Submit Check)
    submitCheckBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        
        if (!name) {
            alert("Please enter your name to confirm the booking.");
            nameInput.focus();
            return;
        }
        
        const summary = `
            Booking Details:
            Barber: ${selectedBarber.name}
            Service: ${selectedService.name}
            Date: ${document.getElementById('summary-date').textContent}
            Start Time: ${document.getElementById('summary-time').textContent}
            End Time: ${document.getElementById('summary-end-time').textContent}
            Total Price: ${document.getElementById('summary-total-price').textContent}
            Name: ${name}
            
            Confirm this appointment?
        `;
        
        if (confirm(summary)) {
            // If user confirms the native dialog, proceed to final submission logic
            finalizeBooking();
        } else {
            announceStatus("Booking canceled by user.");
        }
    });

    function finalizeBooking() {
        const name = nameInput.value.trim();
        const endTime = calculateEndTime(selectedSlot, selectedService.duration);
        
        // Hide form and show confirmation
        steps[3].classList.add('hidden');
        document.getElementById('confirmation-message').classList.remove('hidden');
        setStepIndicator(4); 

        // Update confirmation message content
        document.getElementById('customer-name').textContent = name;
        document.getElementById('booked-service').textContent = selectedService.name;
        document.getElementById('booked-barber').textContent = selectedBarber.name;
        document.getElementById('booked-date').textContent = dateInput.value;
        document.getElementById('booked-time').textContent = selectedSlot;
        document.getElementById('booked-end-time').textContent = endTime; // Confirmed end time
        document.getElementById('booked-price').textContent = `$${selectedService.price}`; // Confirmed price
        
        // Simulate adding to bookings (for this session only)
        SIMULATED_BOOKINGS.push({
            barber: selectedBarber.id,
            date: dateInput.value,
            time: selectedSlot
        });
        
        // Clear local storage upon successful booking
        localStorage.removeItem('barberBookingState');
        announceStatus(`Appointment confirmed for ${name}.`);
    }
});