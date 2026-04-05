// Mock movie data with ID classes for custom hovers
const movies = [
    {
        id: 1,
        title: 'AVENGERS DOOMSDAY',
        poster: 'Doomsadayposter.png',
        summaryPoster: 'drdoom.png',
        duration: '2h 45m',
        price: 15,
        showtimes: ['11:30', '2:45', '4:00', '5:45', '8:00'],
        hoverClass: 'movie-avengers'
    },
    {
        id: 2,
        title: 'SPIRIT',
        poster: 'Spiritposter.png',
        summaryPoster: 'spiritlogoposter.png',
        duration: '2h 30m',
        price: 12,
        showtimes: ['12:00', '2:00', '3:35', '7:00', '9:00'],
        hoverClass: 'movie-spirit'
    },
    {
        id: 3,
        title: 'ROCKSTAR',
        poster: 'rockstarranbirposter.png',
        summaryPoster: 'rockstar2ndposter.png',
        duration: '2h 40m',
        price: 13,
        showtimes: ['2:30', '5:00', '8:00'],
        hoverClass: 'movie-rockstar'
    },
    {
        id: 4,
        title: 'GODZILLA VS KONG',
        poster: 'gXkposter.png',
        summaryPoster: 'godzillavskongfightposter.png',
        duration: '2h 50m',
        price: 14,
        showtimes: ['4:00', '7:45'],
        hoverClass: 'movie-godzilla'
    }
];

let selectedMovie = null;
let selectedShowtime = null;
let selectedSeats = [];
let seatAvailability = {}; 

let selectedPaymentMethod = null;
let selectedCardType = null;
let currentPaymentOTP = null;

document.addEventListener('DOMContentLoaded', function() {
    populateMovies();
    loadBookings();
    setupSmoothScroll();
    console.log('App initialized');
});

function populateMovies() {
    const movieList = document.getElementById('movie-list');
    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = `movie-card ${movie.hoverClass}`;
        let posterStyle = '';
        if (movie.poster && movie.poster.trim() !== '') {
            posterStyle = `background-image: url(${movie.poster});`;
        } else {
            posterStyle = 'background: linear-gradient(45deg, #667eea, #764ba2); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;';
        }
        card.innerHTML = `
            <div class="movie-poster" style="${posterStyle}"></div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-duration"><i class="fas fa-clock"></i> ${movie.duration}</p>
                <p class="movie-price"><i class="fas fa-dollar-sign"></i> $${movie.price} per seat</p>
                <button class="movie-book-btn" onclick="selectMovie(${movie.id})">
                    <i class="fas fa-ticket-alt"></i> Book Tickets
                    <i class="fas fa-arrow-down scroll-arrow" style="margin-left: 5px; opacity: 0; transition: opacity 0.3s;"></i>
                </button>
            </div>
        `;
        movieList.appendChild(card);
    });
}

function selectMovie(movieId) {
    selectedMovie = movies.find(m => m.id === movieId);
    
    // Show downward arrow on book button click
    const btn = event.target.closest('.movie-book-btn');
    const arrow = btn.querySelector('.scroll-arrow');
    arrow.style.opacity = '1';
    setTimeout(() => arrow.style.opacity = '0', 1000);
    
    // Auto scroll to booking section and show it
    setTimeout(() => {
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        document.getElementById('movies').classList.add('hidden');
        document.getElementById('booking').classList.remove('hidden');
        
        // Hide initial showtime selector
        document.querySelector('.showtime-selector').style.display = 'none';
        
        document.getElementById('selected-movie-title').textContent = selectedMovie.title;
        document.getElementById('ticket-price').textContent = selectedMovie.price;
        
        // Populate timings tab
        populateTimings();
        
        // Color "Select Seats" text based on movie
        const seatHeader = document.querySelector('.seat-selector h3');
        seatHeader.style.color = selectedMovie.id === 1 ? '#00ff00' : 
                                 selectedMovie.id === 2 ? '#ffffff' :
                                 selectedMovie.id === 3 ? '#ff0000' :
                                 '#0000ff';
        
        initSeats();
        loadSeatAvailability();
        updateSummary();
    }, 300);
}

function populateTimings() {
    const timingsEl = document.getElementById('show-timings');
    timingsEl.innerHTML = '';
    selectedMovie.showtimes.forEach(time => {
        const btn = document.createElement('button');
        btn.className = 'showtime-btn';
        btn.textContent = time;
        btn.onclick = () => selectTiming(time);
        timingsEl.appendChild(btn);
    });
    // No default selection
}

function selectTiming(time) {
    selectedShowtime = time;
    document.querySelectorAll('#show-timings .showtime-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    loadSeatAvailability();
    updateSummary();
}

function selectShowtime(time) {
    selectedShowtime = time;
    document.querySelectorAll('.showtime-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    initSeats();
    loadSeatAvailability();
    updateSummary();
}

function initSeats() {
    const seatGridEl = document.getElementById('seats');
    // Set seat layout tab background to movie poster ~65% opacity
    const seatSelector = document.querySelector('.seat-selector');
    seatSelector.style.backgroundImage = `url(${selectedMovie.poster})`;
    seatSelector.style.backgroundSize = 'cover';
    seatSelector.style.backgroundPosition = 'center';
    seatSelector.style.backgroundBlendMode = 'multiply';
    seatSelector.style.backgroundColor = 'rgba(0,0,0,0.35)';
    
    seatGridEl.innerHTML = '';
    const key = `${selectedMovie.id}-${selectedShowtime}`;
    const bookedSeats = seatAvailability[key] || [];
    
    for (let row = 0; row < 5; row++) {
        for (let seat = 1; seat <= 10; seat++) {
            const seatId = String.fromCharCode(65 + row) + seat;
            const seatEl = document.createElement('div');
            if (bookedSeats.includes(seatId)) {
                seatEl.className = 'seat booked';
            } else {
                seatEl.className = 'seat available';
            }
            seatEl.textContent = seatId;
            seatEl.onclick = () => toggleSeat(seatEl);
            seatGridEl.appendChild(seatEl);
        }
    }
}

function loadSeatAvailability() {
    const key = `${selectedMovie.id}-${selectedShowtime}`;
    seatAvailability[key] = seatAvailability[key] || [];
}

function toggleSeat(seatEl) {
    if (!selectedShowtime || seatEl.classList.contains('booked')) return;
    
    const seatId = seatEl.textContent;
    const key = `${selectedMovie.id}-${selectedShowtime}`;
    
    if (seatEl.classList.contains('selected')) {
        seatEl.classList.remove('selected');
        seatEl.classList.add('available');
        selectedSeats = selectedSeats.filter(s => s !== seatId);
    } else {
        seatEl.classList.remove('available');
        seatEl.classList.add('selected');
        selectedSeats.push(seatId);
    }
    
    updateSummary();
    checkSeatsConfirmed();
}

function checkSeatsConfirmed() {
    const confirmBtn = document.getElementById('confirm-seats-btn');
    confirmBtn.disabled = selectedSeats.length === 0;
}

function confirmSeats() {
    document.querySelector('.seat-selector').style.opacity = '0.7';
    document.querySelector('.confirm-seats-section').style.background = '#e8f5e8';
    document.getElementById('confirm-seats-btn').textContent = 'Seats Confirmed ✓';
    document.getElementById('confirm-seats-btn').disabled = true;
    updateSummary();
}

function updateSummary() {
    document.getElementById('selected-seats').textContent = selectedSeats.length;
    document.getElementById('selected-timing').textContent = selectedShowtime || 'Not selected';
    const total = selectedSeats.length * selectedMovie.price;
    document.getElementById('total-price').textContent = total;
    const confirmBtn = document.getElementById('confirm-booking');
    confirmBtn.disabled = selectedSeats.length === 0 || !selectedShowtime;
    if (!selectedShowtime) {
        confirmBtn.textContent = 'Please select timing first';
    } else {
        confirmBtn.textContent = 'Confirm Booking';
    }
}

document.getElementById('booking-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!selectedShowtime) {
        alert('Please select show timing first!');
        return;
    }
    
    // Update payment summary
    document.getElementById('payment-movie-title').textContent = selectedMovie.title;
    document.getElementById('payment-showtime').textContent = selectedShowtime;
    document.getElementById('payment-seats').textContent = selectedSeats.join(', ');
    document.getElementById('payment-total').textContent = selectedSeats.length * selectedMovie.price;
    document.getElementById('payment-poster-bg').style.backgroundImage = `url(${selectedMovie.summaryPoster})`;
    
    // Hide form, show payment
    document.querySelector('.user-form').style.display = 'none';
    document.getElementById('payment').classList.remove('hidden');
    
    // Default UPI
    selectedPaymentMethod = 'upi';
    selectPayment('upi');
});

function selectPayment(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Hide all forms
    document.querySelectorAll('.payment-form').forEach(form => form.classList.add('hidden'));
    
    if (method === 'upi') {
        document.getElementById('upi-form').classList.remove('hidden');
    } else if (method === 'card') {
        document.getElementById('card-form').classList.remove('hidden');
        document.getElementById('card-details').classList.add('hidden');
    } else if (method === 'cash') {
        const otp = Math.floor(100000 + Math.random() * 900000);
        document.getElementById('cash-otp-code').textContent = otp;
        document.getElementById('cash Ascendancy')
        document.getElementById('cash-otp').classList.remove('hidden');
    }
}

function selectCardType(type) {
    selectedCardType = type;
    document.querySelectorAll('.card-type-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('card-details').classList.remove('hidden');
}

function confirmUPI() {
    const upiId = document.getElementById('upi-id').value.trim();
    const upiPin = document.getElementById('upi-pin').value.trim();
    
    if (!upiId || !upiId.endsWith('@upi') || !upiPin || upiPin.length < 4) {
        alert('UPI ID must end with @upi and PIN min 4 digits');
        return;
    }
    
    // Generate random 4-digit OTP for venue
    const venueOTP = Math.floor(1000 + Math.random() * 9000);
    document.getElementById('cash-otp-code').textContent = venueOTP;
    document.getElementById('cash Ascendancy')
    document.getElementById('cash-otp').classList.remove('hidden');
}

function confirmCard() {
    const cardNumber = document.getElementById('card-number').value.replace(/\\s/g, '');
    const month = document.getElementById('expiry-month').value.trim();
    const year = document.getElementById('expiry-year').value.trim();
    
    if (!cardNumber || cardNumber.length < 13 || month.length !== 2 || year.length !== 2) {
        alert('Please enter valid card details (Card: min 13 digits, MM/YY)');
        return;
    }
    
    completePayment();
}

function confirmCash() {
    completePayment();
}

function completePayment() {
    // Save booking with payment info
    const booking = {
        id: Date.now(),
        movie: selectedMovie.title,
        showtime: selectedShowtime,
        seats: [...selectedSeats],
        price: selectedSeats.length * selectedMovie.price,
        date: new Date().toLocaleDateString(),
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        paymentMethod: selectedPaymentMethod.toUpperCase(),
        ...(selectedCardType && {cardType: selectedCardType.toUpperCase()})
    };
    
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.unshift(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    // Book seats
    const key = `${selectedMovie.id}-${selectedShowtime}`;
    seatAvailability[key] = seatAvailability[key] || [];
    selectedSeats.forEach(seat => {
        if (!seatAvailability[key].includes(seat)) {
            seatAvailability[key].push(seat);
        }
    });
    localStorage.setItem('seatAvailability', JSON.stringify(seatAvailability));
    
    // Confirmation message
    document.getElementById('confirmation-message').innerHTML = `
        <p><strong>✅ Payment Successful!</strong></p>
        <p><strong>Movie:</strong> ${booking.movie}</p>
        <p><strong>Showtime:</strong> ${booking.showtime}</p>
        <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
        <p><strong>Payment:</strong> ${booking.paymentMethod}${booking.cardType ? ` (${booking.cardType})` : ''}</p>
        <p><strong>Total:</strong> $${booking.price}</p>
        <p>Check your email for confirmation & e-ticket!</p>
    `;
    
    // Show confirmation
    document.getElementById('payment').classList.add('hidden');
    document.getElementById('confirmation').classList.remove('hidden');
    
// Set movie-specific confirmation background
    const confirmationBgMap = {
        'AVENGERS DOOMSDAY': '../aXdbg.png',
        'SPIRIT': '../ashokchakra.png',
        'ROCKSTAR': '../ranbir with guitar.png',
        'GODZILLA VS KONG': '../GxD.png'
    };
    const confirmationEl = document.getElementById('confirmation');
    const bgImage = confirmationBgMap[selectedMovie.title] || '../homebackgroundposter.png';
    confirmationEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bgImage})`;
    confirmationEl.style.backgroundSize = 'cover';
    confirmationEl.style.backgroundPosition = 'center';
    
    // Auto-scroll to confirmation section
    document.getElementById('confirmation').scrollIntoView({ behavior: 'smooth' });
    
    // Reset everything
    document.querySelector('.user-form form').reset();
    selectedSeats = [];
    selectedShowtime = null;
    selectedPaymentMethod = null;
    selectedCardType = null;
    
    loadBookings();
}

function loadBookings() {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const container = document.getElementById('past-bookings');
    
    if (bookings.length === 0) {
        container.innerHTML = '<p>No bookings yet. <a href="#movies">Book now!</a></p>';
    } else {
        container.innerHTML = bookings.slice(0, 5).map(booking => `
            <div class="booking-item" style="background: white; padding: 1.5rem; margin-bottom: 1rem; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); position: relative;">
                <h4>${booking.movie}</h4>
                <p>${booking.date} | ${booking.showtime} | Seats: ${booking.seats.join(', ')}</p>
                <p>$${booking.price} | ${booking.name}</p>
                ${booking.paymentMethod ? `<p>Payment: ${booking.paymentMethod}${booking.cardType ? ` (${booking.cardType})` : ''}</p>` : ''}
                <button class="cancel-btn" onclick="cancelBooking(${booking.id})" style="position: absolute; top: 10px; right: 10px; background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">Cancel Booking</button>
            </div>
        `).join('');
    }
    
    let clearBtn = container.querySelector('.clear-bookings-btn');
    if (!clearBtn) {
        clearBtn = document.createElement('button');
        clearBtn.className = 'clear-bookings-btn';
        clearBtn.textContent = 'Clear All Bookings (Test)';
        clearBtn.style.cssText = 'background: #ff4444; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 20px auto 0; display: block;';
        clearBtn.onclick = () => {
            localStorage.removeItem('bookings');
            localStorage.removeItem('seatAvailability');
            loadBookings();
        };
        container.appendChild(clearBtn);
    }
    
    seatAvailability = JSON.parse(localStorage.getItem('seatAvailability') || '{}');
}

function cancelBooking(bookingId) {
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    
    // Clear corresponding seats
    let seatAvailability = JSON.parse(localStorage.getItem('seatAvailability') || '{}');
    Object.keys(seatAvailability).forEach(key => {
        if (seatAvailability[key]) {
            seatAvailability[key] = []; // Full clear for simplicity
        }
    });
    localStorage.setItem('seatAvailability', JSON.stringify(seatAvailability));
    
    loadBookings();
    alert('Your refund will be sent to your account. Thanks!');
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
            
            if (this.getAttribute('href') !== '#booking') {
                document.getElementById('movies').classList.remove('hidden');
                document.getElementById('booking').classList.add('hidden');
                document.getElementById('confirmation').classList.add('hidden');
            }
        });
    });
}
