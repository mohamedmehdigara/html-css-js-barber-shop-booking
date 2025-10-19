document.addEventListener('DOMContentLoaded', function() {
    // --- DATA SIMULATION ---
    const SERVICES = [
        { id: 'haircut', name: 'Standard Haircut', price: 30, duration: 45 },
        { id: 'beard-trim', name: 'Beard Trim', price: 20, duration: 30 },
        { id: 'haircut-beard', name: 'Haircut & Beard Trim', price: 50, duration: 75 },
        { id: 'shave', name: 'Hot Towel Shave', price: 40, duration: 60 }
    ];

    const BARBERS = [
        { id: 'albert', name: 'Albert', shift: ['09:00', '17:00'] },
        { id: 'ben', name: 'Ben', shift: ['10:00', '18:00'] },
        { id: 'charles', name: 'Charles', shift: ['11:00', '19:00'] }
    ];

    // Simulated Bookings: (BarberID, Date, Time)
    // This simulates already-booked slots for realistic time slot generation
    const SIMULATED_BOOKINGS = [
        { barber: 'albert', date: getTodayDateString(), time: '10:00' },
        { barber: 'albert', date: getTodayDateString(), time: '10:45' },
        { barber: 'ben', date: getTomorrowDateString(), time: '14:30' }
    ];

    // --- DOM Elements ---
    const bookingForm = document.getElementById('booking-form');
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

    // --- State Management ---
    let selectedSlot = null;
    let selectedService = null;
    let selectedBarber = null;

    // --- UTILITY FUNCTIONS ---

    // Get today's date in YYYY-MM-DD format
    function getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }
    
    // Get tomorrow's date in YYYY-MM-DD format (used for simulation example)
    function getTomorrowDateString() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    }

    // --- INITIALIZATION ---

    // Set the minimum date input to today
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

    // --- STEP NAVIGATION ---

    function showStep(stepNumber) {
        Object.keys(steps).forEach(key => {
            steps[key].classList.add('hidden');
        });
        steps[stepNumber].classList.remove('hidden');
    }

    document.getElementById('next-step-2').addEventListener('click', () => {
        if (!selectedService || !selectedBarber) return;
        showStep(2);
        // Reset time selection when moving to Step 2
        selectedSlot = null;
        dateInput.value = '';
        timeContainer.innerHTML = '<p class="placeholder-text">Please select a date to see available times.</p>';
        nextStep3Btn.disabled = true;
    });

    document.getElementById('prev-step-1').addEventListener('click', () => {
        showStep(1);
    });

    document.getElementById('next-step-3').addEventListener('click', () => {
        if (!selectedSlot) return;
        // Update summary in Step 3
        document.getElementById('summary-barber').textContent = BARBERS.find(b => b.id === selectedBarber.id).name;
        document.getElementById('summary-service').textContent = selectedService.name;
        document.getElementById('summary-date').textContent = dateInput.value;
        document.getElementById('summary-time').textContent = selectedSlot;
        showStep(3);
    });

    document.getElementById('prev-step-2').addEventListener('click', () => {
        showStep(2);
    });

    // --- STEP 1 LOGIC (Service & Barber) ---

    // Update service and barber state on change
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

        // Enable Next button if both are selected
        nextStep2Btn.disabled = !(selectedService && selectedBarber);
        
        // If we have selected a barber, and a date is set, re-render slots
        if (dateInput.value) {
             generateTimeSlots();
        }
    }

    serviceSelect.addEventListener('change', updateSelections);
    barberSelect.addEventListener('change', updateSelections);

    // --- STEP 2 LOGIC (Date & Time) ---

    // Function to generate time slots
    function generateTimeSlots() {
        if (!selectedBarber || !selectedService || !dateInput.value) {
            timeContainer.innerHTML = '<p class="placeholder-text">Please select a service, barber, and date.</p>';
            nextStep3Btn.disabled = true;
            return;
        }

        const bookingDate = dateInput.value;
        const duration = selectedService.duration;
        const [startHour, startMinute] = selectedBarber.shift[0].split(':').map(Number);
        const [endHour, endMinute] = selectedBarber.shift[1].split(':').map(Number);
        
        timeContainer.innerHTML = '';
        let availableSlotsExist = false;
        
        let currentTime = new Date(0, 0, 0, startHour, startMinute);
        const endTime = new Date(0, 0, 0, endHour, endMinute);

        while (currentTime.getTime() + duration * 60000 <= endTime.getTime()) {
            const slotStart = ('0' + currentTime.getHours()).slice(-2) + ':' + ('0' + currentTime.getMinutes()).slice(-2);
            
            // Check for simulated booking conflict
            const isBooked = SIMULATED_BOOKINGS.some(booking => 
                booking.barber === selectedBarber.id && 
                booking.date === bookingDate && 
                booking.time === slotStart
            );

            const slotEl = document.createElement('div');
            slotEl.classList.add('time-slot');
            slotEl.textContent = slotStart;
            slotEl.dataset.time = slotStart;

            if (isBooked) {
                slotEl.classList.add('booked');
            } else {
                availableSlotsExist = true;
                slotEl.addEventListener('click', handleSlotSelection);
            }
            
            timeContainer.appendChild(slotEl);

            // Move to the next potential start time (slot duration)
            currentTime = new Date(currentTime.getTime() + duration * 60000);
        }

        if (!availableSlotsExist) {
            timeContainer.innerHTML = '<p class="placeholder-text">No available slots for this combination. Please try another date or barber.</p>';
        }
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
        nextStep3Btn.disabled = true;
        generateTimeSlots();
    });

    // --- STEP 3 LOGIC (Form Submission) ---

    bookingForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Stop form from reloading page

        // --- FINAL CONFIRMATION ---
        const name = document.getElementById('name').value;
        // NOTE: Email is no longer required or collected.
        
        // Hide form and show confirmation
        steps[3].classList.add('hidden');
        document.getElementById('confirmation-message').classList.remove('hidden');

        // Update confirmation message content
        document.getElementById('customer-name').textContent = name;
        document.getElementById('booked-service').textContent = selectedService.name;
        document.getElementById('booked-barber').textContent = selectedBarber.name;
        document.getElementById('booked-date').textContent = dateInput.value;
        document.getElementById('booked-time').textContent = selectedSlot;

        // In a real app, you would now send this data to a server:
        // { name, barber: selectedBarber.id, service: selectedService.id, date: dateInput.value, time: selectedSlot }
        
        // Simulate adding to bookings (for this session only)
        SIMULATED_BOOKINGS.push({
            barber: selectedBarber.id,
            date: dateInput.value,
            time: selectedSlot
        });
    });
});