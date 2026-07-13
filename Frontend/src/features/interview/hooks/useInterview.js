import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useCallback, useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useNavigate, useParams } from "react-router"

const isUnauthorized = (error) => error?.response?.status === 401


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()
    const navigate = useNavigate()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const handleUnauthorized = useCallback((error) => {
        if (!isUnauthorized(error)) {
            return false
        }

        setReport(null)
        setReports([])
        navigate("/login", { replace: true })
        return true
    }, [ navigate, setReport, setReports ])

    const generateReport = useCallback(async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            const interviewReport = response?.interviewReport || null
            setReport(interviewReport)
            return interviewReport
        } catch (error) {
            console.error(error)
            if (handleUnauthorized(error)) {
                return null
            }
            const message = error?.response?.data?.message || error?.message || "Failed to generate interview report."
            alert(message)
            return null
        } finally {
            setLoading(false)
        }
    }, [ handleUnauthorized, setLoading, setReport ])

    const getReportById = useCallback(async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            const interviewReport = response?.interviewReport || null
            setReport(interviewReport)
            return interviewReport
        } catch (error) {
            console.log(error)
            handleUnauthorized(error)
            return null
        } finally {
            setLoading(false)
        }
    }, [ handleUnauthorized, setLoading, setReport ])

    const getReports = useCallback(async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            const interviewReports = response?.interviewReports || []
            setReports(interviewReports)
            return interviewReports
        } catch (error) {
            console.log(error)
            if (handleUnauthorized(error)) {
                return []
            }
            setReports([])
            return []
        } finally {
            setLoading(false)
        }
    }, [ handleUnauthorized, setLoading, setReports ])

    const getResumePdf = useCallback(async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.log(error)
            handleUnauthorized(error)
        } finally {
            setLoading(false)
        }
    }, [ handleUnauthorized, setLoading ])

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ getReportById, getReports, interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }

}
