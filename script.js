// Global variables
let animeList = []
let currentSection = "home"

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage()
  showSection("home")
  setupEventListeners()
  updateStats()

  // Add some initial animation delays
  setTimeout(() => {
    document.body.classList.add("loaded")
  }, 100)
})

// Setup event listeners
function setupEventListeners() {
  // Add form submission
  const addForm = document.getElementById("addForm")
  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault()
      addNewEntry()
    })
  }

  // Edit form submission
  const editForm = document.getElementById("editForm")
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault()
      updateEntry()
    })
  }

  // Search input enter key
  const searchInput = document.getElementById("searchInput")
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchAPI()
      }
    })

    // Add real-time search suggestions
    searchInput.addEventListener("input", debounce(handleSearchInput, 300))
  }

  // Close modal when clicking outside
  const editModal = document.getElementById("editModal")
  if (editModal) {
    editModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeEditModal()
      }
    })
  }

  // Add smooth scrolling for internal links
  document.addEventListener("click", (e) => {
    if (e.target.matches("[data-scroll]")) {
      e.preventDefault()
      const target = document.querySelector(e.target.getAttribute("href"))
      if (target) {
        target.scrollIntoView({ behavior: "smooth" })
      }
    }
  })
}

// Debounce function for search input
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Handle search input for suggestions
function handleSearchInput(e) {
  const query = e.target.value.trim()
  if (query.length > 2) {
    // Could add search suggestions here
    console.log("Searching for:", query)
  }
}

// Navigation functions with enhanced animations
function showSection(sectionName) {
  // Hide all sections with fade out
  const sections = document.querySelectorAll(".section-content")
  sections.forEach((section) => {
    section.style.opacity = "0"
    section.style.transform = "translateY(20px)"
    setTimeout(() => {
      section.classList.add("hidden")
    }, 300)
  })

  // Show selected section with fade in
  setTimeout(() => {
    const targetSection = document.getElementById(sectionName)
    if (targetSection) {
      targetSection.classList.remove("hidden")
      setTimeout(() => {
        targetSection.style.opacity = "1"
        targetSection.style.transform = "translateY(0)"
      }, 50)
    }
  }, 300)

  // Update navigation active state with animation
  const navButtons = document.querySelectorAll(".nav-btn")
  navButtons.forEach((btn) => {
    btn.classList.remove("text-purple-400", "font-bold")
    btn.classList.add("text-gray-300")
    // Remove active indicator
    const indicator = btn.querySelector(".absolute")
    if (indicator) {
      indicator.style.width = "0"
    }
  })

  // Find and activate the correct nav button
  const activeBtn = Array.from(navButtons).find((btn) => {
    const btnText = btn.textContent.toLowerCase().replace(/\s+/g, "")
    const sectionText = sectionName.toLowerCase().replace(/\s+/g, "")
    return btnText.includes(sectionText) || sectionText.includes(btnText)
  })

  if (activeBtn) {
    activeBtn.classList.remove("text-gray-300")
    activeBtn.classList.add("text-purple-400", "font-bold")
    // Animate active indicator
    const indicator = activeBtn.querySelector(".absolute")
    if (indicator) {
      indicator.style.width = "100%"
    }
  }

  currentSection = sectionName

  // Load specific section data
  if (sectionName === "mylist") {
    setTimeout(() => displayMyList(), 400)
  } else if (sectionName === "home") {
    setTimeout(() => updateStats(), 400)
  }
}

// Enhanced local storage functions
function saveToLocalStorage() {
  try {
    localStorage.setItem("animeTracker", JSON.stringify(animeList))
    showNotification("Data saved successfully!", "success")
  } catch (error) {
    console.error("Error saving to localStorage:", error)
    showNotification("Error saving data", "error")
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem("animeTracker")
    if (saved) {
      animeList = JSON.parse(saved)
    }
  } catch (error) {
    console.error("Error loading from localStorage:", error)
    animeList = []
  }
}

// Enhanced CRUD Operations
function addNewEntry() {
  const title = document.getElementById("title").value.trim()
  const posterUrl = document.getElementById("posterUrl").value.trim()
  const status = document.getElementById("status").value
  const genres = document.getElementById("genres").value.trim()
  const description = document.getElementById("description").value.trim()

  if (!title || !status) {
    showNotification("Please fill in all required fields", "error")
    return
  }

  // Check if entry already exists
  const exists = animeList.find((entry) => entry.title.toLowerCase() === title.toLowerCase())
  if (exists) {
    showNotification("An entry with this title already exists!", "warning")
    return
  }

  const newEntry = {
    id: Date.now().toString(),
    title: title,
    posterUrl: posterUrl || `/placeholder.svg?height=300&width=200&text=${encodeURIComponent(title)}`,
    status: status,
    genres: genres
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g),
    description: description,
    dateAdded: new Date().toISOString(),
    isRead: status === "completed",
  }

  animeList.push(newEntry)
  saveToLocalStorage()
  resetForm()
  updateStats()

  // Show success message with animation
  showNotification(`"${title}" added to your vault!`, "success")

  // Animate form reset
  const form = document.getElementById("addForm")
  form.style.transform = "scale(0.95)"
  setTimeout(() => {
    form.style.transform = "scale(1)"
  }, 200)

  // Switch to My List after delay
  setTimeout(() => {
    if (confirm("Entry added! Would you like to view your collection?")) {
      showSection("mylist")
    }
  }, 1000)
}

function updateEntry() {
  const id = document.getElementById("editId").value
  const title = document.getElementById("editTitle").value.trim()
  const posterUrl = document.getElementById("editPosterUrl").value.trim()
  const status = document.getElementById("editStatus").value
  const genres = document.getElementById("editGenres").value.trim()
  const description = document.getElementById("editDescription").value.trim()

  if (!title || !status) {
    showNotification("Please fill in all required fields", "error")
    return
  }

  const entryIndex = animeList.findIndex((entry) => entry.id === id)
  if (entryIndex !== -1) {
    animeList[entryIndex] = {
      ...animeList[entryIndex],
      title: title,
      posterUrl: posterUrl || animeList[entryIndex].posterUrl,
      status: status,
      genres: genres
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g),
      description: description,
      isRead: status === "completed",
    }

    saveToLocalStorage()
    closeEditModal()
    displayMyList()
    updateStats()
    showNotification("Entry updated successfully!", "success")
  }
}

function deleteEntry(id) {
  const entry = animeList.find((e) => e.id === id)
  if (entry && confirm(`Are you sure you want to delete "${entry.title}"?`)) {
    animeList = animeList.filter((entry) => entry.id !== id)
    saveToLocalStorage()
    displayMyList()
    updateStats()
    showNotification("Entry deleted successfully!", "info")
  }
}

function toggleReadStatus(id) {
  const entryIndex = animeList.findIndex((entry) => entry.id === id)
  if (entryIndex !== -1) {
    animeList[entryIndex].isRead = !animeList[entryIndex].isRead
    if (animeList[entryIndex].isRead) {
      animeList[entryIndex].status = "completed"
    } else {
      animeList[entryIndex].status = "ongoing"
    }
    saveToLocalStorage()
    displayMyList()
    updateStats()

    const statusText = animeList[entryIndex].isRead ? "completed" : "ongoing"
    showNotification(`Entry marked as ${statusText}`, "info")
  }
}

function clearAllData() {
  if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
    animeList = []
    saveToLocalStorage()
    displayMyList()
    updateStats()
    showNotification("All data cleared!", "info")
  }
}

// Enhanced display functions
function displayMyList() {
  const grid = document.getElementById("myListGrid")
  const emptyState = document.getElementById("emptyState")

  if (!grid || !emptyState) return

  if (animeList.length === 0) {
    grid.innerHTML = ""
    emptyState.classList.remove("hidden")
    return
  }

  emptyState.classList.add("hidden")

  let filteredList = [...animeList]

  // Apply status filter
  const statusFilter = document.getElementById("statusFilter")
  if (statusFilter && statusFilter.value !== "all") {
    filteredList = filteredList.filter((entry) => entry.status === statusFilter.value)
  }

  // Apply sorting
  const sortBy = document.getElementById("sortBy")
  if (sortBy) {
    if (sortBy.value === "title") {
      filteredList.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy.value === "date") {
      filteredList.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    }
  }

  // Animate grid update
  grid.style.opacity = "0"
  setTimeout(() => {
    grid.innerHTML = filteredList.map((entry, index) => createEntryCard(entry, index)).join("")
    grid.style.opacity = "1"
  }, 200)
}

function createEntryCard(entry, index = 0) {
  const statusColors = {
    ongoing: "from-blue-500 to-blue-600",
    completed: "from-green-500 to-green-600",
    "plan-to-read": "from-yellow-500 to-yellow-600",
  }

  const statusLabels = {
    ongoing: "Ongoing",
    completed: "Completed",
    "plan-to-read": "Plan to Watch",
  }

  const shortDescription =
    entry.description && entry.description.length > 100
      ? entry.description.substring(0, 100) + "..."
      : entry.description || ""

  const safeTitle = entry.title.replace(/'/g, "\\'").replace(/"/g, '\\"')
  const animationDelay = `style="animation-delay: ${index * 0.1}s;"`

  return `
    <div class="glass-effect rounded-2xl hover-lift card-hover animate-fade-in overflow-hidden" ${animationDelay}>
      <div class="relative group">
        <img src="${entry.posterUrl}" alt="${safeTitle}" 
             class="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
             onerror="this.src='/placeholder.svg?height=300&width=200&text=${encodeURIComponent(entry.title)}'">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="absolute top-3 right-3">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${statusColors[entry.status]} text-white shadow-lg">
            ${statusLabels[entry.status]}
          </span>
        </div>
        <div class="absolute bottom-3 left-3 right-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div class="flex gap-2">
            <button onclick="editEntry('${entry.id}')" 
                    class="flex-1 px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-all duration-300">
              <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button onclick="toggleReadStatus('${entry.id}')" 
                    class="flex-1 px-3 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-all duration-300">
              <i class="fas fa-${entry.isRead ? "undo" : "check"} mr-1"></i>${entry.isRead ? "Unread" : "Read"}
            </button>
          </div>
        </div>
      </div>
      
      <div class="p-6">
        <h3 class="font-bold text-xl mb-3 text-white group-hover:text-purple-300 transition-colors duration-300">${entry.title}</h3>
        
        ${
          entry.genres && entry.genres.length > 0
            ? `
          <div class="flex flex-wrap gap-2 mb-3">
            ${entry.genres
              .slice(0, 3)
              .map(
                (genre) =>
                  `<span class="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/30">${genre}</span>`,
              )
              .join("")}
            ${entry.genres.length > 3 ? `<span class="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded-lg">+${entry.genres.length - 3}</span>` : ""}
          </div>
        `
            : ""
        }
        
        ${
          entry.description
            ? `
          <div class="mb-4">
            <p class="text-gray-300 text-sm leading-relaxed" id="desc-${entry.id}">
              ${shortDescription}
            </p>
            ${
              entry.description.length > 100
                ? `
              <button onclick="toggleDescription('${entry.id}')" 
                      class="text-purple-400 text-sm hover:text-purple-300 mt-2 transition-colors duration-300">
                <i class="fas fa-chevron-down mr-1"></i>Read More
              </button>
            `
                : ""
            }
          </div>
        `
            : ""
        }
        
        <div class="flex justify-between items-center pt-4 border-t border-white/10">
          <div class="text-xs text-gray-400">
            <i class="fas fa-calendar mr-1"></i>
            ${new Date(entry.dateAdded).toLocaleDateString()}
          </div>
          <button onclick="deleteEntry('${entry.id}')" 
                  class="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all duration-300 border border-red-500/30">
            <i class="fas fa-trash mr-1"></i>Delete
          </button>
        </div>
      </div>
    </div>
  `
}

function toggleDescription(id) {
  const entry = animeList.find((e) => e.id === id)
  const descElement = document.getElementById(`desc-${id}`)
  const button = descElement ? descElement.nextElementSibling : null

  if (!entry || !descElement || !button) return

  if (button.innerHTML.includes("Read More")) {
    descElement.textContent = entry.description
    button.innerHTML = '<i class="fas fa-chevron-up mr-1"></i>Read Less'
  } else {
    const shortDescription =
      entry.description.length > 100 ? entry.description.substring(0, 100) + "..." : entry.description
    descElement.textContent = shortDescription
    button.innerHTML = '<i class="fas fa-chevron-down mr-1"></i>Read More'
  }
}

// Filter and sort functions
function filterList() {
  displayMyList()
}

function sortList() {
  displayMyList()
}

// Form functions
function resetForm() {
  const addForm = document.getElementById("addForm")
  if (addForm) {
    addForm.reset()
  }
}

function editEntry(id) {
  const entry = animeList.find((e) => e.id === id)
  if (entry) {
    document.getElementById("editId").value = entry.id
    document.getElementById("editTitle").value = entry.title
    document.getElementById("editPosterUrl").value = entry.posterUrl
    document.getElementById("editStatus").value = entry.status
    document.getElementById("editGenres").value = entry.genres ? entry.genres.join(", ") : ""
    document.getElementById("editDescription").value = entry.description || ""

    const editModal = document.getElementById("editModal")
    if (editModal) {
      editModal.classList.remove("hidden")
    }
  }
}

function closeEditModal() {
  const editModal = document.getElementById("editModal")
  if (editModal) {
    editModal.classList.add("hidden")
  }
}

// Enhanced API Search functions
async function searchAPI() {
  const searchInput = document.getElementById("searchInput")
  const query = searchInput ? searchInput.value.trim() : ""

  if (!query) {
    showNotification("Please enter a search term", "warning")
    return
  }

  const resultsContainer = document.getElementById("searchResults")
  const loadingElement = document.getElementById("searchLoading")

  if (!resultsContainer || !loadingElement) return

  resultsContainer.innerHTML = ""
  loadingElement.classList.remove("hidden")

  try {
    // Using Jikan API (MyAnimeList unofficial API)
    const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    loadingElement.classList.add("hidden")

    if (data.data && data.data.length > 0) {
      resultsContainer.innerHTML = data.data.map((anime, index) => createSearchResultCard(anime, index)).join("")
    } else {
      resultsContainer.innerHTML = `
        <div class="col-span-full text-center py-16 animate-fade-in">
          <div class="text-gray-400 text-8xl mb-6 animate-float">
            <i class="fas fa-search"></i>
          </div>
          <h3 class="text-2xl font-bold text-gray-300 mb-4">No results found</h3>
          <p class="text-gray-400">Try searching with different keywords</p>
        </div>
      `
    }
  } catch (error) {
    loadingElement.classList.add("hidden")
    console.error("Search error:", error)
    resultsContainer.innerHTML = `
      <div class="col-span-full text-center py-16 animate-fade-in">
        <div class="text-red-400 text-8xl mb-6">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-300 mb-4">Search Error</h3>
        <p class="text-gray-400 mb-2">Unable to fetch results. Please try again later.</p>
        <p class="text-gray-500 text-sm">${error.message}</p>
      </div>
    `
  }
}

function createSearchResultCard(anime, index = 0) {
  const genres = anime.genres ? anime.genres.map((g) => g.name).slice(0, 3) : []
  const status = anime.status === "Finished Airing" ? "completed" : "ongoing"
  const synopsis = anime.synopsis
    ? anime.synopsis.length > 150
      ? anime.synopsis.substring(0, 150) + "..."
      : anime.synopsis
    : "No description available"

  const safeTitle = anime.title.replace(/'/g, "\\'").replace(/"/g, '\\"')
  const safeSynopsis = synopsis.replace(/'/g, "\\'").replace(/"/g, '\\"')
  const imageUrl =
    anime.images?.jpg?.image_url || `/placeholder.svg?height=300&width=200&text=${encodeURIComponent(anime.title)}`
  const animationDelay = `style="animation-delay: ${index * 0.1}s;"`

  return `
    <div class="glass-effect rounded-2xl hover-lift card-hover animate-fade-in overflow-hidden" ${animationDelay}>
      <div class="relative group">
        <img src="${imageUrl}" 
             alt="${safeTitle}" 
             class="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
             onerror="this.src='/placeholder.svg?height=300&width=200&text=${encodeURIComponent(anime.title)}'">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="absolute top-3 right-3">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
            ${anime.type || "Anime"}
          </span>
        </div>
        ${
          anime.score
            ? `
          <div class="absolute top-3 left-3">
            <span class="px-2 py-1 rounded-lg text-xs font-bold bg-black/50 text-yellow-400 backdrop-blur-sm">
              <i class="fas fa-star mr-1"></i>${anime.score}
            </span>
          </div>
        `
            : ""
        }
      </div>
      
      <div class="p-6">
        <h3 class="font-bold text-xl mb-3 text-white group-hover:text-purple-300 transition-colors duration-300">${anime.title}</h3>
        
        ${
          genres.length > 0
            ? `
          <div class="flex flex-wrap gap-2 mb-3">
            ${genres
              .map(
                (genre) =>
                  `<span class="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/30">${genre}</span>`,
              )
              .join("")}
          </div>
        `
            : ""
        }
        
        <p class="text-gray-300 text-sm mb-4 leading-relaxed">${synopsis}</p>
        
        <div class="flex justify-between items-center mb-4">
          <div class="text-sm text-gray-400">
            ${anime.episodes ? `<i class="fas fa-film mr-1"></i>${anime.episodes} episodes` : ""}
          </div>
        </div>
        
        <button onclick="addFromSearch('${anime.mal_id}', '${safeTitle}', '${imageUrl}', '${status}', '${genres.join(", ")}', '${safeSynopsis}', '${anime.type || "Anime"}')" 
                class="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
          <i class="fas fa-plus mr-2"></i>Add to Vault
        </button>
      </div>
    </div>
  `
}

function addFromSearch(malId, title, posterUrl, status, genres, synopsis, type) {
  // Check if already in list
  const exists = animeList.find((entry) => entry.title.toLowerCase() === title.toLowerCase())
  if (exists) {
    showNotification("This anime is already in your vault!", "warning")
    return
  }

  const newEntry = {
    id: Date.now().toString(),
    title: title,
    posterUrl: posterUrl || `/placeholder.svg?height=300&width=200&text=${encodeURIComponent(title)}`,
    status: "plan-to-read", // Default status when adding from search
    genres: genres ? genres.split(", ").filter((g) => g) : [],
    description: synopsis,
    dateAdded: new Date().toISOString(),
    isRead: false,
    malId: malId,
    type: type,
  }

  animeList.push(newEntry)
  saveToLocalStorage()
  updateStats()
  showNotification(`"${title}" added to your vault!`, "success")
}

// Enhanced utility functions
function showNotification(message, type = "info") {
  const container = document.getElementById("notificationContainer")
  if (!container) return

  const notification = document.createElement("div")
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  }

  const colors = {
    success: "from-green-500 to-green-600",
    error: "from-red-500 to-red-600",
    warning: "from-yellow-500 to-yellow-600",
    info: "from-blue-500 to-blue-600",
  }

  notification.className = `flex items-center px-6 py-4 rounded-xl text-white shadow-2xl animate-slide-left mb-2 glass-effect border border-white/20`
  notification.style.background = `linear-gradient(135deg, var(--tw-gradient-stops))`
  notification.classList.add(`bg-gradient-to-r`, colors[type])

  notification.innerHTML = `
    <i class="${icons[type]} mr-3 text-lg"></i>
    <span class="font-medium">${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-4 text-white/80 hover:text-white transition-colors">
      <i class="fas fa-times"></i>
    </button>
  `

  container.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = "0"
      notification.style.transform = "translateX(100%)"
      setTimeout(() => notification.remove(), 300)
    }
  }, 5000)
}

// Update stats function
function updateStats() {
  const totalElement = document.getElementById("totalAnime")
  const completedElement = document.getElementById("completedAnime")
  const ongoingElement = document.getElementById("ongoingAnime")
  const planToWatchElement = document.getElementById("planToWatch")

  if (!totalElement) return

  const stats = {
    total: animeList.length,
    completed: animeList.filter((entry) => entry.status === "completed").length,
    ongoing: animeList.filter((entry) => entry.status === "ongoing").length,
    planToWatch: animeList.filter((entry) => entry.status === "plan-to-read").length,
  }

  // Animate numbers
  animateNumber(totalElement, stats.total)
  animateNumber(completedElement, stats.completed)
  animateNumber(ongoingElement, stats.ongoing)
  animateNumber(planToWatchElement, stats.planToWatch)
}

function animateNumber(element, target) {
  const current = Number.parseInt(element.textContent) || 0
  const increment = target > current ? 1 : -1
  const duration = 1000
  const steps = Math.abs(target - current)
  const stepDuration = steps > 0 ? duration / steps : 0

  let currentValue = current
  const timer = setInterval(() => {
    currentValue += increment
    element.textContent = currentValue

    if (currentValue === target) {
      clearInterval(timer)
    }
  }, stepDuration)
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case "1":
        e.preventDefault()
        showSection("home")
        break
      case "2":
        e.preventDefault()
        showSection("mylist")
        break
      case "3":
        e.preventDefault()
        showSection("add")
        break
      case "4":
        e.preventDefault()
        showSection("search")
        break
    }
  }

  // Close modal with Escape key
  if (e.key === "Escape") {
    closeEditModal()
  }
})

// Export functions for global access
window.showSection = showSection
window.filterList = filterList
window.sortList = sortList
window.resetForm = resetForm
window.clearAllData = clearAllData
window.searchAPI = searchAPI
window.editEntry = editEntry
window.closeEditModal = closeEditModal
window.deleteEntry = deleteEntry
window.toggleReadStatus = toggleReadStatus
window.toggleDescription = toggleDescription
window.addFromSearch = addFromSearch
