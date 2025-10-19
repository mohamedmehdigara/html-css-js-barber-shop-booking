document.addEventListener('DOMContentLoaded', function() {
    // --- DATA SIMULATION ---
    const SERVICES = [
        { id: 'haircut', name: 'Standard Haircut', price: 30, duration: 45 },
        { id: 'beard-trim', name: 'Beard Trim', price: 20, duration: 30 },
        { id: 'haircut-beard', name: 'Haircut & Beard Trim', price: 50, duration: 75 },
        { id: 'shave', name: 'Hot Towel Shave', price: 40, duration: 60 }
    ];

    const BARBERS = [
        { id: 'albert', name: 'Albert', shift: ['09:00', '17:00'], bio: "Albert is our master of fades and classic cuts. 10 years experience." },
        { id: 'ben', name: 'Ben', shift: ['10:00', '18:00'], bio: "Ben specializes in modern styling and detailed beard shaping." },
        { id: 'charles', name: 'Charles', shift: ['11:00', '19:00'], bio: "Charles is known for his signature hot towel shaves and artistic designs." }
    ];

    // Simulated Bookings: (BarberID, Date, Time)
    const SIMULATED_BOOKINGS = [
        { barber: 'albert', date: getTodayDateString(), time: '10:00' },
        { barber: 'ben', date: getTomorrowDateString(), time: '14:30' }
    ];
    
    // CONSTANTS
    const BOOKING_BUFFER_MINUTES = 60; // Must book at least 60 minutes in the future

    // --- DOM Elements ---
    const bookingForm = document.getElementById('booking-form');
    const stepIndicators = document.querySelectorAll('.indicator');
    const steps = {
        1: document.getElementById('step-1'),
        2: document:getElementById('step-2'),
        3: document:getElementById('step-3')
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

    // --- State Management ---
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

    function setStepIndicator(stepNum) {
        currentStep = stepNum;
        stepIndicators.forEach(indicator => {
            const indicatorStep = parseInt(indicator.dataset.step);
            indicator.classList.remove('active', 'complete');
            if (indicatorStep === stepNum) {
                indicator.classList.add('active');
            } else if (indicatorStep < stepNum) {
                indicator.classList.add('complete');
            }
        });
    }

    // --- INITIALIZATION ---
    dateInput.min = getTodayDateString();

    // Populate service dropdown
    SERVICES.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.name} ($${service.price} - ${service.duration} min)`;
        serviceSelect.appendChild(option);
    });

    // Populate barber dropdown
    BARBERS.forEach(barber => {
        const option = document.createElement('option');
        option.value = barber.id;
        option.textContent = barber.name;
        barberSelect.appendChild(option);
    });
    setStepIndicator(1); // Initialize step indicator

    // --- MODAL LOGIC (Barber Bio) ---
    viewBioBtn.addEventListener('click', () => {
        if (selectedBarber) {
            document.getElementById('modal-barber-name').textContent = selectedBarber.name;
            document.getElementById('modal-barber-bio').textContent = selectedBarber.bio;
            document.getElementById('modal-barber-hours').textContent = `${selectedBarber.shift[0]} - ${selectedBarber.shift[1]}`;
            barberModal.classList.remove('hidden');
        }
    });

    document.querySelector('.close-button').addEventListener('click', () => {
        barberModal.classList.add('hidden');
    });

    // Close modal if user clicks outside of it
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
    }

    document.getElementById('next-step-2').addEventListener('click', () => {
        if (!selectedService || !selectedBarber) return;
        showStep(2);
        selectedSlot = null;
        // Keep date value, but re-validate
        if (dateInput.value) {
            validateDateAndGenerateSlots();
        } else {
            timeContainer.innerHTML = '<p class="placeholder-text">Please select a date to see available times.</p>';
        }
        nextStep3Btn.disabled = true;
    });

    document.getElementById('prev-step-1').addEventListener('click', () => {
        showStep(1);
    });

    document.getElementById('next-step-3').addEventListener('click', () => {
        if (!selectedSlot) return;
        // Update summary in Step 3
        document.getElementById('summary-barber').textContent = selectedBarber.name;
        document.getElementById('summary-service').textContent = selectedService.name;
        document.getElementById('summary-date').textContent = dateInput.value;
        document.getElementById('summary-time').textContent = selectedSlot;
        showStep(3);
    });

    document.getElementById('prev-step-2').addEventListener('click', () => {
        showStep(2);
    });

    // --- STEP 1 LOGIC (Service & Barber) ---

    function updateSelections() {
        const serviceId = serviceSelect.value;
        const barberId = barberSelect.value;
        
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

        // Enable Next button if both are selected
        nextStep2Btn.disabled = !(selectedService && selectedBarber);
        
        // If date is set, re-validate slots based on new barber/service
        if (dateInput.value) {
             validateDateAndGenerateSlots();
        }
    }

    serviceSelect.addEventListener('change', updateSelections);
    barberSelect.addEventListener('change', updateSelections);

    // --- STEP 2 LOGIC (Date & Time) ---
    
    // NEW FEATURE: Date validation (no weekends, no past dates)
    function validateDateAndGenerateSlots() {
        const bookingDateString = dateInput.value;
        if (!bookingDateString || !selectedBarber || !selectedService) {
            dayWarning.classList.add('hidden');
            timeContainer.innerHTML = '<p class="placeholder-text">Please select a service, barber, and date.</p>';
            nextStep3Btn.disabled = true;
            return;
        }

        const bookingDate = new Date(bookingDateString);
        bookingDate.setHours(0, 0, 0, 0); // Normalize time for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check for Saturday (Saturday is 6)
        if (bookingDate.getDay() === 6) {
            dayWarning.classList.remove('hidden');
            timeContainer.innerHTML = '<p class="placeholder-text">No bookings available on Saturdays.</p>';
            nextStep3Btn.disabled = true;
            return;
        } else {
            dayWarning.classList.add('hidden');
        }

        // Check for past dates (should be handled by dateInput.min, but good for robustness)
        if (bookingDate.getTime() < today.getTime()) {
            // This should not happen if dateInput.min is set correctly, but as fallback:
            dayWarning.textContent = "Cannot book in the past.";
            dayWarning.classList.remove('hidden');
            timeContainer.innerHTML = '<p class="placeholder-text">Please select a future date.</p>';
            nextStep3Btn.disabled = true;
            return;
        }

        generateTimeSlots(bookingDateString);
    }

    // Function to generate time slots
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
            
            // 1. Check for simulated booking conflict
            const isBooked = SIMULATED_BOOKINGS.some(booking => 
                booking.barber === selectedBarber.id && 
                booking.date === bookingDateString && 
                booking.time === slotStart
            );
            
            // 2. NEW FEATURE: Check for 60-minute time buffer
            const slotStartTimeMs = currentTime.getTime();
            const bufferTimeMs = now.getTime() + BOOKING_BUFFER_MINUTES * 60000;
            const isTooSoon = slotStartTimeMs < bufferTimeMs;
            
            const slotEl = document.createElement('div');
            slotEl.classList.add('time-slot');
            slotEl.textContent = slotStart;
            slotEl.dataset.time = slotStart;

            if (isBooked) {
                slotEl.classList.add('booked');
            } else if (isTooSoon) {
                 slotEl.classList.add('disabled');
            } else {
                availableSlotsExist = true;
                slotEl.addEventListener('click', handleSlotSelection);
            }
            
            timeContainer.appendChild(slotEl);

            // Move to the next potential start time (slot duration)
            currentTime = new Date(currentTime.getTime() + duration * 60000);
        }

        if (!availableSlotsExist) {
            timeContainer.innerHTML = '<p class="placeholder-text">No available slots for this combination. Try another date or barber.</p>';
        }
        
        // Ensure Next button reflects current slot selection status
        nextStep3Btn.disabled = !selectedSlot;
    }

    function handleSlotSelection(event) {
        // Deselect previous slot
        const previouslySelected = timeContainer.querySelector('.time-slot.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        // Select new slot
        event.target.classList.add('selected');
        selectedSlot = event.target.dataset.time;
        nextStep3Btn.disabled = false; // Enable next button
    }

    dateInput.addEventListener('change', () => {
        // Clear previous time selection
        selectedSlot = null;
        validateDateAndGenerateSlots();
    });

    // --- STEP 3 LOGIC (Form Submission) ---

    bookingForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const name = document.getElementById('name').value;
        
        // Hide form and show confirmation
        steps[3].classList.add('hidden');
        document.getElementById('confirmation-message').classList.remove('hidden');

        // Update confirmation message content
        document.getElementById('customer-name').textContent = name;
        document.getElementById('booked-service').textContent = selectedService.name;
        document.getElementById('booked-barber').textContent = selectedBarber.name;
        document.getElementById('booked-date').textContent = dateInput.value;
        document.getElementById('booked-time').textContent = selectedSlot;
        
        // Simulate adding to bookings (for this session only)
        SIMULATED_BOOKINGS.push({
            barber: selectedBarber.id,
            date: dateInput.value,
            time: selectedSlot
        });
    });
});