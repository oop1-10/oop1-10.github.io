function loadCodeFile(box, file) {
    const pre = box.querySelector('pre');
    const code = pre.querySelector('code');
    const fileUrl = `./${file}`; // Assumes files in same dir; adjust if in subdir like 'code/'
    
    fetch(fileUrl)
        .then(res => {
            if (!res.ok) throw new Error('File not found');
            return res.text();
        })
        .then(text => {
            // Reset the pre/code structure
            pre.innerHTML = '<code class="language-cpp"></code>';
            const newCode = pre.querySelector('code');
            newCode.textContent = text;
            
            // Re-highlight and add line numbers
            hljs.highlightElement(newCode);
            hljs.lineNumbersBlock(newCode);
            
            // Update active class on file buttons
            box.querySelectorAll('.file-selector button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.file === file);
            });
            
            // Store current file for raw/download/copy
            box.dataset.currentFileUrl = fileUrl;
            box.dataset.currentFilename = file;
        })
        .catch(err => {
            pre.innerHTML = '<code>Error loading file: ' + err.message + '</code>';
        });
}

// Performance utilities
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener("DOMContentLoaded", () => {
    // Cache DOM elements
    const body = document.body;
    const contentDiv = document.querySelector(".content");
    
    // Init: Add listeners to file buttons and load first file
    document.querySelectorAll('.code-box').forEach(box => {
        const fileButtons = box.querySelectorAll('.file-selector button');
        fileButtons.forEach(btn => {
            btn.addEventListener('click', () => loadCodeFile(box, btn.dataset.file));
        });
        
        // Load the first file by default
        if (fileButtons.length > 0) {
            fileButtons[0].click();
        }

        // Attach action button handlers
        const copyBtn = box.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => copyCode(copyBtn));

        const rawBtn = box.querySelector('.raw-btn');
        rawBtn.addEventListener('click', () => viewRaw(rawBtn));

        // Attach download handler
        const dlLink = box.querySelector('.download-link');
        dlLink.addEventListener('click', e => {
            e.preventDefault();
            downloadCode(dlLink);
        });
    });

    function copyCode(btn) {
        const codeElement = btn.parentElement.parentElement.nextElementSibling.querySelector('code');
        let code = codeElement.innerText;
        code = code.split('\n').filter(line => line.trim() !== '').join('\n');
        navigator.clipboard.writeText(code).then(() => {
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = 'Copy', 2000);
        });
    }

    function viewRaw(btn) {
        const box = btn.closest('.code-box');
        const fileUrl = box.dataset.currentFileUrl;
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    }

    function downloadCode(btn) {
        const box = btn.closest('.code-box');
        const fileUrl = box.dataset.currentFileUrl;
        const filename = box.dataset.currentFilename;
        if (fileUrl) {
            const tempA = document.createElement('a');
            tempA.href = fileUrl;
            tempA.download = filename;
            body.appendChild(tempA);
            tempA.click();
            body.removeChild(tempA);
        }
    }

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function(e) {
            // skip download-link so it won't trigger exit animation
            if (this.classList.contains('download-link')) return;
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

    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
        if (typeof hljs.initLineNumbersOnLoad === 'function') {
            hljs.initLineNumbersOnLoad();
        }
    }

    // Add back button to project pages
    if (window.location.pathname.includes('/projects/')) {
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.textContent = '← Back to Homepage';
        backButton.href = '/';
        backButton.style.opacity = '0';
        
        // Add click handler specifically for the back button
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            const currentPage = document.querySelector(".content");
            currentPage.style.animation = 'slide-out 0.9s cubic-bezier(0, 0, 0.48, 1) forwards';
            
            setTimeout(() => {
                window.location.href = '/';
            }, 900);
        });

        // Append back button and build project panel by fetching homepage project links
        body.appendChild(backButton);
        const panel = document.createElement('div');
        panel.className = 'project-panel';
        panel.style.opacity = '0';
        body.appendChild(panel);
        
        fetch('/')
            .then(res => res.text())
            .then(html => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const links = doc.querySelectorAll('.projecttab a');
                const fragment = document.createDocumentFragment();
                
                links.forEach(link => {
                    const rawHref = link.getAttribute('href');
                    const href = rawHref.startsWith('/') ? rawHref : `/${rawHref}`;
                    const fallback = link.textContent.trim();
                    const btn = document.createElement('a');
                    btn.setAttribute('role','button');
                    btn.className = 'in-project-button';
                    btn.href = href;
                    
                    // Fetch project page to get its <title>
                    fetch(href)
                        .then(r => r.text())
                        .then(pageHtml => {
                            const pdoc = new DOMParser().parseFromString(pageHtml, 'text/html');
                            btn.textContent = pdoc.querySelector('title')?.textContent || fallback;
                        })
                        .catch(() => { btn.textContent = fallback; });
                    
                    btn.addEventListener('click', e => {
                        e.preventDefault();
                        contentDiv.style.animation = 'slide-out 0.9s cubic-bezier(0,0,0.48,1) forwards';
                        setTimeout(() => window.location.href = btn.href, 900);
                    });
                    fragment.appendChild(btn);
                });
                
                panel.appendChild(fragment);
                setTimeout(() => panel.style.opacity = '1', 900);
                
                // Add collapse/expand toggle button at bottom
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'panel-toggle';
                toggleBtn.textContent = '▲';
                toggleBtn.addEventListener('click', () => {
                    panel.classList.toggle('collapsed');
                    toggleBtn.textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
                });
                panel.appendChild(toggleBtn);
            });

        // Simplified position update function (no caching)
        const updateButtonPosition = () => {
            const contentRect = contentDiv.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            
            if (windowWidth > 1360) {
                backButton.style.position = 'fixed';
                backButton.style.left = `${contentRect.left - backButton.offsetWidth - 20}px`;
                backButton.style.right = 'auto';
            } else {
                backButton.style.position = 'fixed';
                backButton.style.left = '20px';
                backButton.style.right = 'auto';
            }
            
            panel.style.left = backButton.style.left;
            panel.style.top = `${contentRect.top + backButton.offsetHeight + 30}px`;
            panel.style.width = `${backButton.offsetWidth}px`;
            backButton.style.top = `${contentRect.top + 20}px`;
        };

        // Wait for the page animation to complete before showing the button
        setTimeout(() => {
            updateButtonPosition();
            backButton.style.opacity = '1';
        }, 900);

        // Throttled event listeners
        const throttledUpdatePosition = throttle(updateButtonPosition, 16); // ~60fps
        window.addEventListener('resize', debounce(updateButtonPosition, 100));
        window.addEventListener('scroll', throttledUpdatePosition);
    }

    // Table of Contents Widget
    function initTableOfContents() {
        const headings = document.querySelectorAll('.content h1, .content h2, .content h3, .content h4');
        if (headings.length < 2) return;

        // Cache elements and values
        const tocWidget = document.createElement('div');
        tocWidget.className = 'toc-widget';
        
        const progressTrack = document.createElement('div');
        progressTrack.className = 'toc-progress-track';
        tocWidget.appendChild(progressTrack);
        
        const progressBar = document.createElement('div');
        progressBar.className = 'toc-progress-bar';
        tocWidget.appendChild(progressBar);

        const tocItems = [];
        
        // Create items individually and append them
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }

            const tocItem = document.createElement('button');
            tocItem.className = `toc-item toc-${heading.tagName.toLowerCase()}`;
            tocItem.setAttribute('aria-label', heading.textContent);
            
            // Position items from 10% to 80% to avoid clipping
            const itemPosition = headings.length === 1 ? 10 : 10 + (index / (headings.length - 1)) * 70;
            tocItem.style.position = 'absolute';
            tocItem.style.top = `${itemPosition}%`;
            tocItem.style.transform = 'translateY(-50%)';
            
            tocItem.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Add click animation
                tocItem.classList.add('clicked');
                setTimeout(() => {
                    tocItem.classList.remove('clicked');
                }, 400);
                
                // Scroll to heading
                heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            // Add the button to the widget first
            tocWidget.appendChild(tocItem);
            
            // Now create and add the label as a separate element
            const label = document.createElement('span');
            label.className = 'toc-item-label';
            label.textContent = heading.textContent;
            label.style.position = 'absolute';
            label.style.left = '35px';
            label.style.top = `${itemPosition}%`;
            label.style.transform = 'translateY(-50%)';
            label.style.background = 'transparent';
            label.style.color = 'rgba(255, 255, 255, 0.5)';
            label.style.padding = '4px 8px';
            label.style.borderRadius = '4px';
            label.style.fontSize = '12px';
            label.style.whiteSpace = 'nowrap';
            label.style.opacity = '0';
            label.style.visibility = 'hidden';
            label.style.transition = 'all 0.2s ease';
            label.style.zIndex = '1002';
            label.style.pointerEvents = 'none';
            label.style.maxWidth = '200px';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.fontWeight = '400';
            
            // Add the label to the widget
            tocWidget.appendChild(label);
            
            // Store references for hover events
            tocItems.push({ 
                element: tocItem, 
                heading: heading, 
                label: label 
            });
            
            // Add hover events
            tocItem.addEventListener('mouseenter', () => {
                label.style.opacity = '1';
                label.style.visibility = 'visible';
                label.style.transform = 'translateY(-50%) translateX(5px)';
            });
            
            tocItem.addEventListener('mouseleave', () => {
                label.style.opacity = '0';
                label.style.visibility = 'hidden';
                label.style.transform = 'translateY(-50%)';
            });
        });
        
        body.appendChild(tocWidget);

        let lastScrollTop = -1;
        let lastActiveIndex = -1;

        // Simplified position update function (no caching)
        const updateTOCPosition = () => {
            const contentRect = contentDiv.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            
            if (windowWidth > 1400) {
                tocWidget.style.position = 'fixed';
                tocWidget.style.left = `${contentRect.right + 20}px`;
                tocWidget.style.top = `${contentRect.top + 60}px`;
                tocWidget.style.height = `${Math.min(contentRect.height - 120, window.innerHeight * 0.6)}px`;
                tocWidget.classList.add('visible');
            } else {
                tocWidget.classList.remove('visible');
            }
        };

        const trackScroll = () => {
            const scrollTop = contentDiv.scrollTop;
            
            // Skip if scroll hasn't changed significantly
            if (Math.abs(scrollTop - lastScrollTop) < 5) return;
            lastScrollTop = scrollTop;
            
            const scrollHeight = contentDiv.scrollHeight;
            const clientHeight = contentDiv.clientHeight;
            const maxScroll = scrollHeight - clientHeight;
            
            // Update progress bar
            let scrollProgress = 0;
            if (maxScroll > 0) {
                scrollProgress = Math.min(1, Math.max(0, scrollTop / maxScroll));
            }
            progressBar.style.height = `${scrollProgress * 100}%`;
            
            // Find active heading
            let newActiveIndex = -1;
            const offset = clientHeight * 0.3;
            
            for (let i = 0; i < headings.length; i++) {
                const headingOffsetTop = headings[i].offsetTop - contentDiv.offsetTop;
                const nextHeadingOffsetTop = i < headings.length - 1 ? 
                    headings[i + 1].offsetTop - contentDiv.offsetTop : 
                    scrollHeight;
                
                if (scrollTop + offset >= headingOffsetTop && scrollTop + offset < nextHeadingOffsetTop) {
                    newActiveIndex = i;
                    break;
                }
            }
            
            if (newActiveIndex === -1 && scrollTop + clientHeight >= scrollHeight - 10) {
                newActiveIndex = headings.length - 1;
            }

            // Only update active state if it changed
            if (newActiveIndex !== lastActiveIndex) {
                tocItems.forEach((item, index) => {
                    item.element.classList.remove('active');
                    // Update label color based on active state
                    if (index === newActiveIndex) {
                        item.label.style.color = 'rgba(255, 255, 255, 1.0)';
                    } else {
                        item.label.style.color = 'rgba(255, 255, 255, 0.5)';
                    }
                });
                
                if (newActiveIndex >= 0 && tocItems[newActiveIndex]) {
                    tocItems[newActiveIndex].element.classList.add('active');
                }
                
                lastActiveIndex = newActiveIndex;
            }
        };

        // Initialize after content loads
        setTimeout(() => {
            updateTOCPosition();
            trackScroll();
        }, 100);

        // Throttled event listeners for better performance
        const throttledTrackScroll = throttle(trackScroll, 16); // ~60fps
        const throttledUpdateTOC = throttle(updateTOCPosition, 16);
        
        window.addEventListener('resize', debounce(updateTOCPosition, 100));
        window.addEventListener('scroll', throttledUpdateTOC);
        contentDiv.addEventListener('scroll', throttledTrackScroll);
    }

    // Initialize TOC for project pages
    if (window.location.pathname.includes('/projects/')) {
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
            setTimeout(initTableOfContents, 1000);
        });
    }

    // settings for particles.js
    try {
        console.log("Initializing particles.js");
        if (typeof particlesJS !== "undefined") {
            particlesJS("particles-js", {
                "particles": {
                    "number": {
                        "value": 120,
                        "density": {
                            "enable": true,
                            "value_area": 1000 // Increased area for fewer particles
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
                        "speed": 1, // Reduced speed
                        "direction": "none",
                        "random": false,
                        "straight": false,
                        "out_mode": "out",
                        "bounce": false
                        // Removed attract
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
                            "enable": false
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
})