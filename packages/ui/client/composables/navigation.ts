import type { File, Task } from '@vitest/runner'
import { client, config, findById } from './client'
import { testRunState } from './client/state'
import { activeFileId, lineNumber, viewMode } from './params'

export const currentModule = ref<File>()
export const dashboardVisible = ref(true)
export const coverageVisible = ref(false)
export const disableCoverage = ref(true)
export const coverage = computed(() => config.value?.coverage)
export const coverageConfigured = computed(() => coverage.value?.enabled)
export const coverageEnabled = computed(() => {
  return (
    coverageConfigured.value
    && !!coverage.value.htmlReporter
  )
})
export const detailSizes = useLocalStorage<[left: number, right: number]>(
  'vitest-ui_splitpanes-detailSizes',
  [33, 67],
  {
    initOnMounted: true,
  },
)

// TODO
// For html report preview, "coverage.reportsDirectory" must be explicitly set as a subdirectory of html report.
// Handling other cases seems difficult, so this limitation is mentioned in the documentation for now.
export const coverageUrl = computed(() => {
  if (coverageEnabled.value) {
    const idx = coverage.value!.reportsDirectory.lastIndexOf('/')
    const htmlReporterSubdir = coverage.value!.htmlReporter?.subdir
    return htmlReporterSubdir
      ? `/${coverage.value!.reportsDirectory.slice(idx + 1)}/${
          htmlReporterSubdir
        }/index.html`
      : `/${coverage.value!.reportsDirectory.slice(idx + 1)}/index.html`
  }

  return undefined
})

watch(
  testRunState,
  (state) => {
    disableCoverage.value = state === 'running'
  },
  { immediate: true },
)

export function initializeNavigation() {
  const file = activeFileId.value
  if (file && file.length > 0) {
    const current = findById(file)
    if (current) {
      currentModule.value = current
      dashboardVisible.value = false
      coverageVisible.value = false
    }
    else {
      watchOnce(
        () => client.state.getFiles(),
        () => {
          currentModule.value = findById(file)
          dashboardVisible.value = false
          coverageVisible.value = false
        },
      )
    }
  }

  return dashboardVisible
}

export function showDashboard(show: boolean) {
  dashboardVisible.value = show
  coverageVisible.value = false
  if (show) {
    currentModule.value = undefined
    activeFileId.value = ''
  }
}

export function navigateTo(task: Task, line: number | null = null) {
  activeFileId.value = task.file.id
  // reset line number
  lineNumber.value = null
  if (line != null) {
    nextTick(() => {
      lineNumber.value = line
    })
    viewMode.value = 'editor'
  }
  currentModule.value = findById(task.file.id)
  showDashboard(false)
}

export function showCoverage() {
  coverageVisible.value = true
  dashboardVisible.value = false
  currentModule.value = undefined
  activeFileId.value = ''
}
