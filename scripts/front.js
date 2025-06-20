document.addEventListener("DOMContentLoaded", () => {
    // Add page transition handling
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.href && this.href.startsWith(window.location.origin)) {
                e.preventDefault();
                const currentPage = document.querySelector('.content');
                currentPage.style.animation = 'slide-out 0.9s cubic-bezier(0, 0, 0.48, 1) forwards';
                
                setTimeout(() => {
                    window.location.href = this.href;
                }, 900);
            }
        });
    });

    // Add back button to project pages
    if (window.location.pathname.includes('/projects/')) {
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.textContent = '← Back to Homepage';
        backButton.href = '/';
        backButton.style.opacity = '0'; // Start invisible
        
        // Add click handler specifically for the back button
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            const currentPage = document.querySelector(".content");
            currentPage.style.animation = 'slide-out 0.9s cubic-bezier(0, 0, 0.48, 1) forwards';
            
            setTimeout(() => {
                window.location.href = '/';
            }, 900);
        });

        // Append the button to the body
        document.body.appendChild(backButton);

        // Position the button relative to the content div
        const contentDiv = document.querySelector(".content");
        const updateButtonPosition = () => {
            const contentRect = contentDiv.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            
            if (windowWidth > 1200) {
                // Position to the left of content when there's enough space
                backButton.style.position = 'fixed';
                backButton.style.left = `${contentRect.left - backButton.offsetWidth - 20}px`;
                backButton.style.right = 'auto';
            } else {
                // Fixed position on the left when screen is narrow
                backButton.style.position = 'fixed';
                backButton.style.left = '20px';
                backButton.style.right = 'auto';
            }
            backButton.style.top = `${contentRect.top + 20}px`;
        };

        // Wait for the page animation to complete before showing the button
        setTimeout(() => {
            updateButtonPosition();
            backButton.style.transition = 'opacity 0.3s ease';
            backButton.style.opacity = '1';
        }, 900); // Match the duration of the slide-in animation

        // Update position on resize and scroll
        window.addEventListener('resize', updateButtonPosition);
        window.addEventListener('scroll', updateButtonPosition);
    }

    try {
        console.log("Initializing particles.js");
        if (typeof particlesJS !== "undefined") {
            particlesJS("particles-js", {
                "particles": {
                    "number": {
                        "value": 120,
                        "density": {
                            "enable": true,
                            "value_area": 700
                        }
                    },
                    "color": {
                        "value": "#86b9b0"
                    },
                    "shape": {
                        "type": "circle",
                        "stroke": {
                            "width": 0,
                            "color": "#86b9b0"
                        },
                        "polygon": {
                            "nb_sides": 5
                        },
                        "image": {
                            "src": "img/github.svg",
                            "width": 100,
                            "height": 100
                        }
                    },
                    "opacity": {
                        "value": 0.5,
                        "random": false,
                        "anim": {
                            "enable": false,
                            "speed": 1,
                            "opacity_min": 0.1,
                            "sync": false
                        }
                    },
                    "size": {
                        "value": 3,
                        "random": true,
                        "anim": {
                            "enable": false,
                            "speed": 40,
                            "size_min": 0.1,
                            "sync": false
                        }
                    },
                    "line_linked": {
                        "enable": true,
                        "distance": 120,
                        "color": "#86b9b0",
                        "opacity": 0.4,
                        "width": 1
                    },
                    "move": {
                        "enable": true,
                        "speed": 2,
                        "direction": "none",
                        "random": false,
                        "straight": false,
                        "out_mode": "out",
                        "bounce": false,
                        "attract": {
                            "enable": false,
                            "rotateX": 600,
                            "rotateY": 1200
                        }
                    }
                },
                "interactivity": {
                    "detect_on": "canvas",
                    "events": {
                        "onhover": {
                            "enable": true,
                            "mode": "grab"
                        },
                        "onclick": {
                            "enable": false,
                            "mode": "push"
                        },
                        "resize": true
                    },
                    "modes": {
                        "grab": {
                            "distance": 120,
                            "line_linked": {
                                "opacity": 1
                            }
                        },
                        "bubble": {
                            "distance": 400,
                            "size": 40,
                            "duration": 2,
                            "opacity": 8,
                            "speed": 3
                        },
                        "repulse": {
                            "distance": 200,
                            "duration": 0.4
                        },
                        "push": {
                            "particles_nb": 4
                        },
                        "remove": {
                            "particles_nb": 2
                        }
                    }
                },
                "retina_detect": true
            });
        } else {
            console.warn("particlesJS is not defined. Skipping particle initialization.");
        }
    } catch (error) {
        console.error("Error initializing particles:", error);
    }
});

var particlesJS;