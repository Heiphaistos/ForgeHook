/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from 'vue';
import api from '../api/client';
import { useUiStore } from '../stores/ui';
const ui = useUiStore();
const files = ref([]);
const uploading = ref(false);
const isDragging = ref(false);
const fileInput = ref(null);
const search = ref('');
const sortBy = ref('date');
const selected = ref(new Set());
const previewFile = ref(null);
const totalSize = computed(() => fmtSize(files.value.reduce((sum, f) => sum + f.size, 0)));
const filteredFiles = computed(() => {
    let list = files.value;
    if (search.value)
        list = list.filter(f => f.name.toLowerCase().includes(search.value.toLowerCase()));
    if (sortBy.value === 'name')
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy.value === 'size')
        list = [...list].sort((a, b) => b.size - a.size);
    return list;
});
onMounted(loadFiles);
async function loadFiles() {
    const { data } = await api.get('/uploads/list');
    files.value = data;
}
function fmtSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1048576)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}
function toggleSelect(name) {
    if (selected.value.has(name))
        selected.value.delete(name);
    else
        selected.value.add(name);
    selected.value = new Set(selected.value);
}
function onDrop(e) {
    isDragging.value = false;
    const items = Array.from(e.dataTransfer?.files ?? []);
    uploadFiles(items);
}
function onFileInput(e) {
    const items = Array.from(e.target.files ?? []);
    uploadFiles(items);
    if (fileInput.value)
        fileInput.value.value = '';
}
async function uploadFiles(items) {
    if (!items.length)
        return;
    uploading.value = true;
    let uploaded = 0;
    for (const file of items) {
        try {
            const fd = new FormData();
            fd.append('file', file);
            await api.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            uploaded++;
        }
        catch (e) {
            ui.notify(e.response?.data?.error ?? `Erreur: ${file.name}`, 'error');
        }
    }
    uploading.value = false;
    await loadFiles();
    if (uploaded > 0)
        ui.notify(`${uploaded} fichier${uploaded > 1 ? 's' : ''} uploadé${uploaded > 1 ? 's' : ''}`);
}
async function deleteFile(name) {
    await api.delete(`/uploads/${name}`);
    files.value = files.value.filter(f => f.name !== name);
    selected.value.delete(name);
    selected.value = new Set(selected.value);
    ui.notify('Fichier supprimé');
}
async function deleteSelected() {
    for (const name of selected.value)
        await api.delete(`/uploads/${name}`);
    files.value = files.value.filter(f => !selected.value.has(f.name));
    selected.value = new Set();
    ui.notify('Sélection supprimée');
}
async function copyUrl(url) {
    await navigator.clipboard.writeText(url);
    ui.notify('URL copiée !');
}
function openPreview(f) { previewFile.value = f; }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['drop-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['drop-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['media-card']} */ ;
/** @type {__VLS_StyleScopedClasses['media-thumb-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['media-thumb']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "page-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-meta" },
});
if (__VLS_ctx.files.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "meta-info" },
    });
    (__VLS_ctx.files.length);
    (__VLS_ctx.files.length > 1 ? 's' : '');
    (__VLS_ctx.totalSize);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onDragover: (...[$event]) => {
            __VLS_ctx.isDragging = true;
        } },
    ...{ onDragleave: (...[$event]) => {
            __VLS_ctx.isDragging = false;
        } },
    ...{ onDrop: (__VLS_ctx.onDrop) },
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.fileInput?.click();
        } },
    ...{ class: "drop-zone" },
    ...{ class: ({ dragging: __VLS_ctx.isDragging }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "drop-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "drop-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.onFileInput) },
    ref: "fileInput",
    type: "file",
    accept: "image/*",
    multiple: true,
    ...{ style: {} },
});
/** @type {typeof __VLS_ctx.fileInput} */ ;
if (__VLS_ctx.uploading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-progress" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "upload-bar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "upload-fill" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
if (__VLS_ctx.files.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "filters-bar" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "🔍 Filtrer par nom...",
        ...{ class: "fh-input filter-search" },
    });
    (__VLS_ctx.search);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.sortBy),
        ...{ class: "fh-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "date",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "name",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "size",
    });
}
if (__VLS_ctx.filteredFiles.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "media-grid" },
    });
    for (const [f] of __VLS_getVForSourceType((__VLS_ctx.filteredFiles))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (f.name),
            ...{ class: "media-card" },
            ...{ class: ({ selected: __VLS_ctx.selected.has(f.name) }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.filteredFiles.length))
                        return;
                    __VLS_ctx.toggleSelect(f.name);
                } },
            ...{ class: "media-thumb-wrap" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            ...{ onError: (...[$event]) => {
                    if (!(__VLS_ctx.filteredFiles.length))
                        return;
                    $event.target.src = '';
                } },
            src: (f.url),
            ...{ class: "media-thumb" },
            loading: "lazy",
            alt: (f.name),
        });
        if (__VLS_ctx.selected.has(f.name)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "media-check" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "media-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "media-name" },
            title: (f.name),
        });
        (f.name.slice(0, 28));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "media-size" },
        });
        (__VLS_ctx.fmtSize(f.size));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "media-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.filteredFiles.length))
                        return;
                    __VLS_ctx.copyUrl(f.url);
                } },
            ...{ class: "btn-secondary" },
            ...{ style: {} },
            title: "Copier URL",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.filteredFiles.length))
                        return;
                    __VLS_ctx.openPreview(f);
                } },
            ...{ class: "btn-secondary" },
            ...{ style: {} },
            title: "Aperçu",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.filteredFiles.length))
                        return;
                    __VLS_ctx.deleteFile(f.name);
                } },
            ...{ class: "btn-danger-sm" },
            title: "Supprimer",
        });
    }
}
if (__VLS_ctx.selected.size > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "selection-bar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.selected.size);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.deleteSelected) },
        ...{ class: "btn-danger" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selected.size > 0))
                    return;
                __VLS_ctx.selected.clear();
                __VLS_ctx.selected = new Set(__VLS_ctx.selected);
            } },
        ...{ class: "btn-secondary" },
    });
}
if (!__VLS_ctx.files.length && !__VLS_ctx.uploading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-state" },
    });
}
if (__VLS_ctx.previewFile) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.previewFile))
                    return;
                __VLS_ctx.previewFile = null;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal preview-modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ style: {} },
    });
    (__VLS_ctx.previewFile.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.previewFile))
                    return;
                __VLS_ctx.previewFile = null;
            } },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.previewFile.url),
        ...{ style: {} },
        alt: (__VLS_ctx.previewFile.name),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "url-copy-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.previewFile.url),
        readonly: true,
        ...{ class: "fh-input" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.previewFile))
                    return;
                __VLS_ctx.copyUrl(__VLS_ctx.previewFile.url);
            } },
        ...{ class: "btn-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.fmtSize(__VLS_ctx.previewFile.size));
}
/** @type {__VLS_StyleScopedClasses['page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-info']} */ ;
/** @type {__VLS_StyleScopedClasses['drop-zone']} */ ;
/** @type {__VLS_StyleScopedClasses['drop-content']} */ ;
/** @type {__VLS_StyleScopedClasses['drop-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['filters-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-search']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-select']} */ ;
/** @type {__VLS_StyleScopedClasses['media-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['media-card']} */ ;
/** @type {__VLS_StyleScopedClasses['media-thumb-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['media-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['media-check']} */ ;
/** @type {__VLS_StyleScopedClasses['media-info']} */ ;
/** @type {__VLS_StyleScopedClasses['media-name']} */ ;
/** @type {__VLS_StyleScopedClasses['media-size']} */ ;
/** @type {__VLS_StyleScopedClasses['media-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['selection-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['url-copy-row']} */ ;
/** @type {__VLS_StyleScopedClasses['fh-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            files: files,
            uploading: uploading,
            isDragging: isDragging,
            fileInput: fileInput,
            search: search,
            sortBy: sortBy,
            selected: selected,
            previewFile: previewFile,
            totalSize: totalSize,
            filteredFiles: filteredFiles,
            fmtSize: fmtSize,
            toggleSelect: toggleSelect,
            onDrop: onDrop,
            onFileInput: onFileInput,
            deleteFile: deleteFile,
            deleteSelected: deleteSelected,
            copyUrl: copyUrl,
            openPreview: openPreview,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
