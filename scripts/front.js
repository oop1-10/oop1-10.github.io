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
    const body = document.body;
    const contentDiv = document.querySelector(".content");
    const progressBar = document.querySelector('.progress-bar');
    const progress = document.querySelector(".progress");
    var pageHeight = contentDiv.scrollHeight;

    document.querySelectorAll('.code-box').forEach(box => {
        const fileButtons = box.querySelectorAll('.file-selector button');
        fileButtons.forEach(btn => {
            btn.addEventListener('click', () => loadCodeFile(box, btn.dataset.file));
        });
        
        if (fileButtons.length > 0) {
            fileButtons[0].click();
        }

        const copyBtn = box.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => copyCode(copyBtn));

        const rawBtn = box.querySelector('.raw-btn');
        rawBtn.addEventListener('click', () => viewRaw(rawBtn));

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
            if (this.classList.contains('download-link')) return;
            if (this.href && this.href.startsWith(window.location.origin)) {
                e.preventDefault();
                const currentPage = contentDiv;
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
        const markers = document.querySelectorAll('h1, h2');
        markerAmount = markers.length;
        markerHeights = [];

        var totalHeight = 0;
        markers.forEach((marker, index) => {
            const headingMarker = document.createElement('div');
            const headingLabel = document.createElement('span');
            headingLabel.textContent = marker.textContent;
            progressBar.appendChild(headingMarker);
            progressBar.appendChild(headingLabel);
            headingMarker.classList.add('marker');
            headingLabel.classList.add('marker-label');
            headingLabel.style.left = `${20 + headingMarker.left}px`;

            const percent = (totalHeight/pageHeight) * 100;
            headingMarker.style.top = percent + "%";
            headingLabel.style.top = (percent * 0.7) + 9.5 + "%";

            progressBar.appendChild(headingLabel);

            markerHeights.push(percent);

            const next = markers[index + 1];
            const start = marker.offsetTop;
            const end   = next ? next.offsetTop : contentDiv.scrollHeight;
            totalHeight += end - start;

            headingMarker.addEventListener('click', function() {
                const scrollTo = start - contentDiv.offsetTop;
                contentDiv.scrollTo({
                    top: scrollTo,
                    behavior: 'smooth'
                });
                headingMarker.style.animation = 'toc-click-pulse 0.3s ease-out forwards';
                setTimeout(() => headingMarker.style.animation = '', 300);
            });

            headingMarker.addEventListener('mouseover', function() {
                headingLabel.style.opacity = '1';
            });
            headingMarker.addEventListener('mouseout', function() {
                headingLabel.style.opacity = '0.2';
            });
        });

        contentDiv.addEventListener('scroll', updateProgress);

        function updateProgress() {
            const scrollTop = contentDiv.scrollTop;
            const maxScroll = contentDiv.scrollHeight - contentDiv.clientHeight;
            const percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
            progress.style.height = percent + "%";

            for (let i = 0; i < markerAmount; i++) {
                const markerPercent = markerHeights[i];
                const nextMarkerPercent = markerHeights[i+1] || 100;
                
                if (percent >= markerPercent && percent < nextMarkerPercent) {
                    progressBar.children[(i*2)+1].classList.add('active-heading');
                    progressBar.children[(i*2)+2].style.opacity = '1';
                } else if (percent === 100) {
                    progressBar.children[children.length-1].classList.add('active-heading');
                } else {
                    progressBar.children[(i*2)+1].classList.remove('active-heading');
                    progressBar.children[(i*2)+2].style.opacity = '0.2';
                }
            }
        }

        updateProgress();
        
        const backButton = document.createElement('button');
        backButton.className = 'back-button';
        backButton.textContent = '← Back to Homepage';
        backButton.href = '/';
        backButton.style.opacity = '0';
        
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
                progressBar.style.left = '5px';
            }
            
            progressBar.style.left = `${contentRect.left + contentRect.width + 20}px`;

            panel.style.left = backButton.style.left;
            panel.style.top = `${contentRect.top + backButton.offsetHeight + 30}px`;
            panel.style.width = `${backButton.offsetWidth}px`;
            backButton.style.top = `${contentRect.top + 20}px`;
        };

        setTimeout(() => {
            updateButtonPosition();
            backButton.style.opacity = '1';
            progressBar.style.opacity = '1';
        }, 900);

        const throttledUpdatePosition = throttle(updateButtonPosition, 0); // ~60fps
        window.addEventListener('resize', debounce(updateButtonPosition, 0));
        window.addEventListener('scroll', throttledUpdatePosition);
    }

    // settings for particles.js
    try {
        console.log("Initializing particles.js");
        if (typeof particlesJS !== "undefined") {
            particlesJS("particles-js", {
                "particles": {
                    "number": {
                        "value": 60,
                        "density": {
                            "enable": true,
                            "value_area": 2000
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
                        "value": 0.7,
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
                        "speed": 1,
                        "direction": "none",
                        "random": false,
                        "straight": false,
                        "out_mode": "out",
                        "bounce": false
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