const projectGrid = document.querySelector("#projects-chronological .project-list");

if (projectGrid) {
    const projects = Array.from(projectGrid.children);
    projects.sort((left, right) => right.dataset.projectSortDate.localeCompare(left.dataset.projectSortDate));
    projectGrid.append(...projects);
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// Link menus are popovers placed with CSS anchor positioning. Where that isn't
// supported, place them under their toggle when they open.
if (!CSS.supports("anchor-name: --a")) {
    for (const menu of document.querySelectorAll(".project-links-menu")) {
        menu.addEventListener("toggle", (event) => {
            if (event.newState !== "open") {
                return;
            }

            const toggle = menu.previousElementSibling.getBoundingClientRect();
            menu.style.top = `${toggle.bottom}px`;
            if (menu.closest(".project-list-compact")) {
                menu.style.left = "auto";
                menu.style.right = `${document.documentElement.clientWidth - toggle.right}px`;
            } else {
                menu.style.left = `${toggle.left}px`;
            }
        });
    }

    // The fallback position is fixed to the viewport, so close menus on scroll.
    window.addEventListener("scroll", () => {
        document.querySelector(".project-links-menu:popover-open")?.hidePopover();
    }, { passive: true });
}

// Grid cards have view-transition-names, so the browser animates them to their
// new positions, fading in and out cards that appear or disappear.
const animateProjectChange = (updateProjects) => {
    if (!document.startViewTransition || prefersReducedMotion.matches) {
        updateProjects();
        return;
    }

    document.startViewTransition(updateProjects);
};

const viewToggle = document.querySelector("[data-project-view-toggle]");

if (viewToggle) {
    const viewToggleLabel = viewToggle.querySelector("[data-project-view-toggle-label]");
    const filterSelect = document.querySelector("[data-project-filter-select]");
    const views = Array.from(document.querySelectorAll("[data-project-view]"));
    const viewNames = new Set(views.map((view) => view.dataset.projectView));
    const categoryButtons = Array.from(document.querySelectorAll("[data-project-category-button]"));
    const chronologicalView = document.querySelector('[data-project-view="chronological"]');
    const chronologicalProjects = Array.from(chronologicalView.querySelectorAll(".project-card"));
    const filterNames = new Set(Array.from(filterSelect.options, (option) => option.value));

    viewToggle.hidden = false;

    const showCategory = (categoryName, shouldAnimate = false) => {
        const activeCategory = filterNames.has(categoryName) ? categoryName : "all";
        const updateProjects = () => {
            for (const project of chronologicalProjects) {
                project.hidden = activeCategory !== "all" && project.dataset.projectCategory !== activeCategory;
            }
        };

        if (shouldAnimate) {
            animateProjectChange(updateProjects);
        } else {
            updateProjects();
        }

        filterSelect.value = activeCategory;

        for (const button of categoryButtons) {
            const isActive = button.dataset.projectCategoryButton === activeCategory;
            button.setAttribute("aria-pressed", String(isActive));
        }
    };

    const showProjectView = (viewName, shouldAnimate = false) => {
        const activeViewName = viewNames.has(viewName) ? viewName : "grouped";
        const updateProjects = () => {
            for (const view of views) {
                view.hidden = view.dataset.projectView !== activeViewName;
            }
        };

        if (shouldAnimate) {
            animateProjectChange(updateProjects);
        } else {
            updateProjects();
        }

        viewToggle.setAttribute("aria-label", activeViewName === "grouped" ? "Switch to chronological grid view" : "Switch to grouped view");
        viewToggle.setAttribute("title", activeViewName === "grouped" ? "Switch to chronological grid view" : "Switch to grouped view");

        viewToggleLabel.textContent = activeViewName === "grouped" ? "Grouped" : "Chronological";

        // Grid videos don't autoplay so they aren't downloaded while the grid is hidden.
        if (activeViewName === "chronological") {
            for (const video of chronologicalView.querySelectorAll("video")) {
                video.play().catch(() => {});
            }
        }
    };

    // The view is kept in ?view= (grouped is the default) and the category in the hash.
    const initialCategory = window.location.hash ? window.location.hash.slice(1) : "all";
    showProjectView(new URLSearchParams(location.search).get("view"));
    showCategory(initialCategory);

    filterSelect.addEventListener("change", () => {
        const categoryName = filterSelect.value;
        showCategory(categoryName, true);
        history.replaceState(null, "", categoryName === "all" ? `${location.pathname}${location.search}` : `#${categoryName}`);
    });

    viewToggle.addEventListener("click", () => {
        const currentViewName = chronologicalView.hidden ? "grouped" : "chronological";
        const viewName = currentViewName === "grouped" ? "chronological" : "grouped";
        showProjectView(viewName, true);

        const url = new URL(location.href);
        if (viewName === "grouped") {
            url.searchParams.delete("view");
        } else {
            url.searchParams.set("view", viewName);
        }
        history.replaceState(null, "", url);
    });

    for (const button of categoryButtons) {
        button.addEventListener("click", () => {
            const categoryName = button.dataset.projectCategoryButton;
            showCategory(categoryName, true);
            history.replaceState(null, "", `#${categoryName}`);
        });
    }
}
