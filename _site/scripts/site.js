const projectLists = Array.from(document.querySelectorAll(".project-list"));

for (const projectList of projectLists) {
    const projects = Array.from(projectList.querySelectorAll(".project-card"));
    projects.sort((left, right) => {
        const leftSortDate = left.dataset.projectSortDate || "";
        const rightSortDate = right.dataset.projectSortDate || "";
        return rightSortDate.localeCompare(leftSortDate);
    });

    for (const project of projects) {
        projectList.append(project);
    }
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const projectLinkMenus = Array.from(document.querySelectorAll(".project-links-more"));

if (projectLinkMenus.length) {
    const closeProjectLinkMenus = (activeMenu = null) => {
        for (const menu of projectLinkMenus) {
            if (menu !== activeMenu) {
                menu.open = false;
            }
        }
    };

    document.addEventListener("pointerdown", (event) => {
        const activeMenu = event.target instanceof Element ? event.target.closest(".project-links-more") : null;
        closeProjectLinkMenus(activeMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeProjectLinkMenus();
        }
    });
}

const getVisibleProjects = () => Array.from(document.querySelectorAll(".project-card")).filter((project) => {
    return !project.hidden && !project.closest("[hidden]");
});

const animateProjectChange = (updateProjects) => {
    if (prefersReducedMotion.matches) {
        updateProjects();
        return;
    }

    const previousRects = new Map();

    for (const project of getVisibleProjects()) {
        previousRects.set(project, project.getBoundingClientRect());
    }

    for (const project of document.querySelectorAll(".project-card")) {
        for (const animation of project.getAnimations()) {
            animation.cancel();
        }
    }

    updateProjects();

    for (const project of getVisibleProjects()) {
        const previousRect = previousRects.get(project);
        const currentRect = project.getBoundingClientRect();
        const deltaX = previousRect ? previousRect.left - currentRect.left : 0;
        const deltaY = previousRect ? previousRect.top - currentRect.top : 8;
        const moved = Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5;
        const isNewlyVisible = !previousRect;

        if (!moved && !isNewlyVisible) {
            continue;
        }

        project.classList.add("is-animating");

        const animation = project.animate([
            {
                opacity: isNewlyVisible ? 0 : 1,
                transform: `translate(${deltaX}px, ${deltaY}px)`,
            },
            {
                opacity: 1,
                transform: "translate(0, 0)",
            },
        ], {
            duration: isNewlyVisible ? 180 : 260,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
        });

        animation.addEventListener("finish", () => {
            project.classList.remove("is-animating");
        });
        animation.addEventListener("cancel", () => {
            project.classList.remove("is-animating");
        });
    }
};

const projectViewControls = document.querySelector("[data-project-view-controls]");

if (projectViewControls) {
    const viewToggle = projectViewControls.querySelector("[data-project-view-toggle]");
    const viewToggleLabel = projectViewControls.querySelector("[data-project-view-toggle-label]");
    const filterControls = document.querySelector("[data-project-filter-controls]");
    const filterSelect = filterControls ? filterControls.querySelector("[data-project-filter-select]") : null;
    const views = Array.from(document.querySelectorAll("[data-project-view]"));
    const viewNames = new Set(views.map((view) => view.dataset.projectView));
    const categoryButtons = Array.from(document.querySelectorAll("[data-project-category-button]"));
    const chronologicalView = document.querySelector('[data-project-view="chronological"]');
    const chronologicalProjects = chronologicalView ? Array.from(chronologicalView.querySelectorAll(".project-card")) : [];
    const filterNames = filterSelect ? new Set(Array.from(filterSelect.options).map((option) => option.value)) : new Set();

    projectViewControls.hidden = false;

    if (filterControls && filterSelect) {
        filterControls.hidden = false;
    }

    const showCategory = (categoryName, shouldAnimate = false) => {
        if (!filterSelect) {
            return;
        }

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
            document.body.dataset.projectView = activeViewName;

            for (const view of views) {
                view.hidden = view.dataset.projectView !== activeViewName;
            }
        };

        if (shouldAnimate) {
            animateProjectChange(updateProjects);
        } else {
            updateProjects();
        }

        viewToggle.dataset.projectViewCurrent = activeViewName;
        viewToggle.setAttribute("aria-label", activeViewName === "grouped" ? "Switch to chronological grid view" : "Switch to grouped view");
        viewToggle.setAttribute("title", activeViewName === "grouped" ? "Switch to chronological grid view" : "Switch to grouped view");

        if (viewToggleLabel) {
            viewToggleLabel.textContent = activeViewName === "grouped" ? "Grouped" : "Chronological";
        }
    };

    const initialCategory = window.location.hash ? window.location.hash.slice(1) : "all";
    showProjectView("grouped");
    showCategory(initialCategory);

    if (filterSelect) {
        filterSelect.addEventListener("change", () => {
            const categoryName = filterSelect.value;
            showCategory(categoryName, true);
            history.replaceState(null, "", categoryName === "all" ? `${location.pathname}${location.search}` : `#${categoryName}`);
        });
    }

    viewToggle.addEventListener("click", () => {
        const currentViewName = document.body.dataset.projectView === "chronological" ? "chronological" : "grouped";
        const viewName = currentViewName === "grouped" ? "chronological" : "grouped";
        showProjectView(viewName, true);
    });

    for (const button of categoryButtons) {
        button.addEventListener("click", () => {
            const categoryName = button.dataset.projectCategoryButton;
            showCategory(categoryName, true);
            history.replaceState(null, "", `#${categoryName}`);
        });
    }
}
