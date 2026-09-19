import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "../services/api";
import "./LoanApplication.css";

const steps = [
  {
    number: 1,
    title: "Personal Details",
    subtitle: "Tell us about yourself",
  },
  {
    number: 2,
    title: "Loan Details",
    subtitle: "Choose your loan",
  },
  {
    number: 3,
    title: "Income Details",
    subtitle: "Share your income",
  },
  {
    number: 4,
    title: "Documents",
    subtitle: "Upload required documents",
  },
  {
    number: 5,
    title: "Review & Submit",
    subtitle: "Check your application",
  },
];

const loanTypes = [
  {
    value: "PERSONAL",
    label: "Personal Loan",
    description:
      "For personal expenses, education and other needs",
    rate: 12,
  },
  {
    value: "HOME",
    label: "Home Loan",
    description:
      "Finance your home purchase or construction",
    rate: 8.5,
  },
  {
    value: "VEHICLE",
    label: "Vehicle Loan",
    description:
      "Finance a new or pre-owned vehicle",
    rate: 9.5,
  },
  {
    value: "BUSINESS",
    label: "Business Loan",
    description:
      "Grow or expand your business",
    rate: 11,
  },
];

const initialFormData = {
  personalDetails: {
    fullName: "",
    dateOfBirth: "",
    panNumber: "",
    address: "",
  },

  loanDetails: {
    loanType: "",
    amount: "",
    tenure: "",
    purpose: "",
  },

  incomeDetails: {
    monthlyIncome: "",
    employmentType: "",
  },
};

const initialDocuments = {
  ID_PROOF: null,
  INCOME_PROOF: null,
};

/*
 * The backend stores employment categories using its
 * supported enum values. "Professional" is presented
 * as a user-friendly option in the UI and is treated as
 * self-employed when sent to the backend.
 *
 * This prevents a Mongoose enum validation error while
 * keeping the UI label "Professional".
 */
const normalizeEmploymentTypeForApi = (employmentType) => {
  if (!employmentType) {
    return "";
  }

  const normalized = String(employmentType)
    .trim()
    .toUpperCase()
    .replace(/[ -]+/g, "_");

  /*
   * UI-only options are mapped to the backend enum.
   * The backend stores both Professional and Business Owner
   * as SELF_EMPLOYED.
   */
  if (
    normalized === "PROFESSIONAL" ||
    normalized === "BUSINESS_OWNER"
  ) {
    return "SELF_EMPLOYED";
  }

  /*
   * Accept common spellings when restoring data.
   */
  if (
    normalized === "SELF_EMPLOYED" ||
    normalized === "SELFEMPLOYED" ||
    normalized === "SELF_EMPLOYMENT"
  ) {
    return "SELF_EMPLOYED";
  }

  return normalized;
};

const normalizeEmploymentTypeFromApi = (employmentType) => {
  if (!employmentType) {
    return "";
  }

  const normalized = String(employmentType)
    .trim()
    .toUpperCase()
    .replace(/[ -]+/g, "_");

  if (
    normalized === "SELF_EMPLOYED" ||
    normalized === "SELFEMPLOYED" ||
    normalized === "SELF_EMPLOYMENT"
  ) {
    return "SELF_EMPLOYED";
  }

  if (normalized === "BUSINESS_OWNER") {
    return "BUSINESS_OWNER";
  }

  if (normalized === "PROFESSIONAL") {
    return "PROFESSIONAL";
  }

  if (normalized === "SALARIED") {
    return "SALARIED";
  }

  if (normalized === "OTHER") {
    return "OTHER";
  }

  return normalized;
};

const formatEmploymentTypeForDisplay = (employmentType) => {
  if (!employmentType) {
    return "";
  }

  return employmentType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const LoanApplication = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /*
   * If id exists, we are editing/resuming an existing
   * application.
   *
   * If id does not exist, this is a brand-new application.
   */
  const [loanId, setLoanId] = useState(id || null);

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] =
    useState(initialFormData);

  /*
   * New files selected in the current browser session.
   */
  const [documents, setDocuments] =
    useState(initialDocuments);

  /*
   * Documents that already exist on the backend.
   *
   * Browser security prevents us from putting an
   * existing server file back into <input type="file">,
   * so we keep these separately.
   */
  const [existingDocuments, setExistingDocuments] =
    useState({
      ID_PROOF: null,
      INCOME_PROOF: null,
    });

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * Keeps track of which route/application has already
   * been initialized.
   *
   * This prevents React StrictMode from creating the
   * same new draft twice during development.
   */
  const initializedKeyRef = useRef(null);

  /*
   * =====================================================
   * INITIALIZE APPLICATION
   * =====================================================
   *
   * Two possible flows:
   *
   * 1. /applicant/apply
   *    -> create ONE draft
   *    -> navigate to /applicant/apply/:id
   *
   * 2. /applicant/apply/:id
   *    -> GET existing application
   *    -> restore all saved data
   *    -> do NOT create a new draft
   */
  useEffect(() => {
    const initializationKey =
      id || "NEW_APPLICATION";

    /*
     * React StrictMode may execute effects more than once
     * in development.
     *
     * Don't initialize the same application twice.
     */
    if (
      initializedKeyRef.current ===
      initializationKey
    ) {
      return;
    }

    initializedKeyRef.current =
      initializationKey;

    const initializeApplication =
      async () => {
        try {
          setLoading(true);
          setError("");
          setSuccess("");

          let loan;

          /*
           * =================================================
           * EXISTING APPLICATION
           * =================================================
           */
          if (id) {
            const response =
              await api.get(
                `/loans/${id}`
              );

            loan =
              response.data.loanApplication;

            if (!loan) {
              throw new Error(
                "The requested loan application could not be found."
              );
            }

            setLoanId(loan._id);
          }

          /*
           * =================================================
           * NEW APPLICATION
           * =================================================
           */
          else {
            const response =
              await api.post("/loans");

            loan =
              response.data.loanApplication;

            if (!loan?._id) {
              throw new Error(
                "Draft was created but no application ID was returned."
              );
            }

            setLoanId(loan._id);

            /*
             * IMPORTANT:
             *
             * Replace /applicant/apply with the actual
             * application URL.
             *
             * From this point onward, refreshing the page
             * will GET this application instead of POSTing
             * another one.
             */
            navigate(
              `/applicant/apply/${loan._id}`,
              {
                replace: true,
              }
            );
          }

          /*
           * =================================================
           * RESTORE PERSONAL DETAILS
           * =================================================
           */
          if (loan.personalDetails) {
            setFormData((prev) => ({
              ...prev,

              personalDetails: {
                ...prev.personalDetails,

                fullName:
                  loan.personalDetails.fullName ||
                  "",

                /*
                 * HTML date inputs require:
                 * YYYY-MM-DD
                 */
                dateOfBirth:
                  loan.personalDetails.dateOfBirth
                    ? new Date(
                        loan.personalDetails.dateOfBirth
                      )
                        .toISOString()
                        .split("T")[0]
                    : "",

                panNumber:
                  loan.personalDetails.panNumber ||
                  "",

                address:
                  loan.personalDetails.address ||
                  "",
              },
            }));
          }

          /*
           * =================================================
           * RESTORE LOAN DETAILS
           * =================================================
           */
          if (loan.loanDetails) {
            setFormData((prev) => ({
              ...prev,

              loanDetails: {
                ...prev.loanDetails,

                loanType:
                  loan.loanDetails.loanType ||
                  "",

                amount:
                  loan.loanDetails.amount ??
                  "",

                tenure:
                  loan.loanDetails.tenure ??
                  "",

                purpose:
                  loan.loanDetails.purpose ||
                  "",
              },
            }));
          }

          /*
           * =================================================
           * RESTORE INCOME DETAILS
           * =================================================
           */
          if (loan.incomeDetails) {
            setFormData((prev) => ({
              ...prev,

              incomeDetails: {
                ...prev.incomeDetails,

                monthlyIncome:
                  loan.incomeDetails
                    .monthlyIncome ??
                  "",

                employmentType:
                  normalizeEmploymentTypeFromApi(
                    loan.incomeDetails.employmentType
                  ),
              },
            }));
          }

          /*
           * =================================================
           * LOAD EXISTING DOCUMENTS
           * =================================================
           */
          try {
            const documentResponse =
              await api.get(
                `/loans/${loan._id}/documents`
              );

            const serverDocuments =
              documentResponse.data
                .documents || [];

            setExistingDocuments({
              ID_PROOF:
                serverDocuments.find(
                  (document) =>
                    document.documentType ===
                    "ID_PROOF"
                ) || null,

              INCOME_PROOF:
                serverDocuments.find(
                  (document) =>
                    document.documentType ===
                    "INCOME_PROOF"
                ) || null,
            });
          } catch (documentError) {
            /*
             * Document loading should not prevent
             * the rest of the application from loading.
             */
            console.error(
              "Unable to load existing documents:",
              documentError
            );
          }

        } catch (err) {
          console.error(
            "Initialize application error:",
            err
          );

          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load your loan application."
          );
        } finally {
          setLoading(false);
        }
      };

    initializeApplication();
  }, [id, navigate]);

  /*
   * =====================================================
   * UPDATE FORM FIELD
   * =====================================================
   */
  const updateField = (
    section,
    field,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,

      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    setError("");
    setSuccess("");
  };

  /*
   * =====================================================
   * SELECTED LOAN
   * =====================================================
   */
  const selectedLoan = useMemo(() => {
    return loanTypes.find(
      (loan) =>
        loan.value ===
        formData.loanDetails.loanType
    );
  }, [
    formData.loanDetails.loanType,
  ]);

  /*
   * =====================================================
   * INTEREST RATE
   * =====================================================
   */
  const interestRate =
    selectedLoan?.rate || 0;

  /*
   * =====================================================
   * FRONTEND EMI PREVIEW
   * =====================================================
   */
  const estimatedEMI = useMemo(() => {
    const principal =
      Number(
        formData.loanDetails.amount
      );

    const tenure =
      Number(
        formData.loanDetails.tenure
      );

    if (
      !principal ||
      !tenure ||
      !interestRate
    ) {
      return 0;
    }

    const monthlyRate =
      interestRate / 12 / 100;

    const emi =
      (principal *
        monthlyRate *
        Math.pow(
          1 + monthlyRate,
          tenure
        )) /
      (Math.pow(
        1 + monthlyRate,
        tenure
      ) - 1);

    return Number.isFinite(emi)
      ? emi
      : 0;
  }, [
    formData.loanDetails.amount,
    formData.loanDetails.tenure,
    interestRate,
  ]);

  /*
   * =====================================================
   * FORMAT CURRENCY
   * =====================================================
   */
  const formatCurrency = (
    amount
  ) => {
    if (!amount) {
      return "₹0";
    }

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(amount);
  };

  /*
   * =====================================================
   * SAVE DRAFT
   * =====================================================
   *
   * Only non-empty fields are sent.
   *
   * This allows partially completed applications
   * to be saved safely.
   */
  const saveDraft = async (
    showMessage = true
  ) => {
    if (!loanId) {
      setError(
        "Your application is not ready yet. Please try again."
      );

      return false;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {};

      /*
       * =================================================
       * PERSONAL DETAILS
       * =================================================
       */
      const personalDetails = {};

      if (
        formData.personalDetails.fullName.trim()
      ) {
        personalDetails.fullName =
          formData.personalDetails.fullName.trim();
      }

      if (
        formData.personalDetails.dateOfBirth
      ) {
        personalDetails.dateOfBirth =
          formData.personalDetails.dateOfBirth;
      }

      if (
        formData.personalDetails.panNumber.trim()
      ) {
        personalDetails.panNumber =
          formData.personalDetails.panNumber
            .trim()
            .toUpperCase();
      }

      if (
        formData.personalDetails.address.trim()
      ) {
        personalDetails.address =
          formData.personalDetails.address.trim();
      }

      if (
        Object.keys(personalDetails).length >
        0
      ) {
        payload.personalDetails =
          personalDetails;
      }

      /*
       * =================================================
       * LOAN DETAILS
       * =================================================
       */
      const loanDetails = {};

      if (
        formData.loanDetails.loanType
      ) {
        loanDetails.loanType =
          formData.loanDetails.loanType;
      }

      if (
        formData.loanDetails.amount &&
        Number(
          formData.loanDetails.amount
        ) > 0
      ) {
        loanDetails.amount =
          Number(
            formData.loanDetails.amount
          );
      }

      if (
        formData.loanDetails.tenure &&
        Number(
          formData.loanDetails.tenure
        ) > 0
      ) {
        loanDetails.tenure =
          Number(
            formData.loanDetails.tenure
          );
      }

      if (
        formData.loanDetails.purpose.trim()
      ) {
        loanDetails.purpose =
          formData.loanDetails.purpose.trim();
      }

      if (
        Object.keys(loanDetails).length >
        0
      ) {
        payload.loanDetails =
          loanDetails;
      }

      /*
       * =================================================
       * INCOME DETAILS
       * =================================================
       */
      const incomeDetails = {};

      if (
        formData.incomeDetails.monthlyIncome &&
        Number(
          formData.incomeDetails.monthlyIncome
        ) > 0
      ) {
        incomeDetails.monthlyIncome =
          Number(
            formData.incomeDetails.monthlyIncome
          );
      }

      if (
        formData.incomeDetails
          .employmentType
      ) {
        incomeDetails.employmentType =
          normalizeEmploymentTypeForApi(
            formData.incomeDetails
              .employmentType
          );
      }

      if (
        Object.keys(incomeDetails).length >
        0
      ) {
        payload.incomeDetails =
          incomeDetails;
      }

      /*
       * =================================================
       * EMPTY PAYLOAD
       * =================================================
       */
      if (
        Object.keys(payload).length ===
        0
      ) {
        setError(
          "Please enter some information before saving."
        );

        return false;
      }

      /*
       * =================================================
       * PATCH EXISTING APPLICATION
       * =================================================
       */
      const response =
        await api.patch(
          `/loans/${loanId}`,
          payload
        );

      const loan =
        response.data.loanApplication;

      if (!loan) {
        throw new Error(
          "Application was saved but no application data was returned."
        );
      }

      setLoanId(loan._id);

      /*
       * =================================================
       * SYNCHRONIZE LOCAL FORM
       * =================================================
       */
      if (loan.personalDetails) {
        setFormData((prev) => ({
          ...prev,

          personalDetails: {
            ...prev.personalDetails,
            ...loan.personalDetails,
          },
        }));
      }

      if (loan.loanDetails) {
        setFormData((prev) => ({
          ...prev,

          loanDetails: {
            ...prev.loanDetails,
            ...loan.loanDetails,
          },
        }));
      }

      if (loan.incomeDetails) {
        setFormData((prev) => ({
          ...prev,

          incomeDetails: {
            ...prev.incomeDetails,
            ...loan.incomeDetails,

            /*
             * Keep the user's current UI selection after saving.
             *
             * This is important because the UI has options such as
             * Professional and Business Owner which are stored by
             * the backend as SELF_EMPLOYED.
             *
             * Never replace a currently selected value with the
             * backend's normalized value after a successful save.
             */
            employmentType:
              prev.incomeDetails.employmentType
                ? prev.incomeDetails.employmentType
                : normalizeEmploymentTypeFromApi(
                    loan.incomeDetails.employmentType
                  ),
          },
        }));
      }

      /*
       * Keep URL synchronized with the application.
       */
      if (
        window.location.pathname !==
        `/applicant/apply/${loan._id}`
      ) {
        navigate(
          `/applicant/apply/${loan._id}`,
          {
            replace: true,
          }
        );
      }

      if (showMessage) {
        setSuccess(
          "Your application has been saved successfully."
        );
      }

      return loan;

    } catch (err) {
      console.error(
        "Save draft error:",
        err
      );

      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.error;

      setError(
        backendMessage ||
          "Unable to save your application. Please try again."
      );

      return false;

    } finally {
      setSaving(false);
    }
  };

  /*
   * =====================================================
   * VALIDATE STEP
   * =====================================================
   */
  const validateStep = (
    step
  ) => {
    const errors = [];

    /*
     * STEP 1
     */
    if (step === 1) {
      const {
        fullName,
        dateOfBirth,
        panNumber,
        address,
      } = formData.personalDetails;

      if (!fullName.trim()) {
        errors.push(
          "Full name is required."
        );
      }

      if (!dateOfBirth) {
        errors.push(
          "Date of birth is required."
        );
      }

      if (!panNumber.trim()) {
        errors.push(
          "PAN / ID number is required."
        );
      }

      if (!address.trim()) {
        errors.push(
          "Address is required."
        );
      }
    }

    /*
     * STEP 2
     */
    if (step === 2) {
      const {
        loanType,
        amount,
        tenure,
        purpose,
      } = formData.loanDetails;

      if (!loanType) {
        errors.push(
          "Please select a loan type."
        );
      }

      if (
        !amount ||
        Number(amount) <= 0
      ) {
        errors.push(
          "Please enter a valid loan amount."
        );
      }

      if (
        !tenure ||
        Number(tenure) <= 0
      ) {
        errors.push(
          "Please enter a valid loan tenure."
        );
      }

      if (!purpose.trim()) {
        errors.push(
          "Loan purpose is required."
        );
      }
    }

    /*
     * STEP 3
     */
    if (step === 3) {
      const {
        monthlyIncome,
        employmentType,
      } = formData.incomeDetails;

      if (
        !monthlyIncome ||
        Number(monthlyIncome) <= 0
      ) {
        errors.push(
          "Please enter your monthly income."
        );
      }

      if (!employmentType) {
        errors.push(
          "Please select your employment type."
        );
      }
    }

    /*
     * STEP 4
     *
     * A document is valid if:
     *
     * - a new file is selected
     * OR
     * - a document already exists on the server
     */
    if (step === 4) {
      if (
        !documents.ID_PROOF &&
        !existingDocuments.ID_PROOF
      ) {
        errors.push(
          "ID proof is required."
        );
      }

      if (
        !documents.INCOME_PROOF &&
        !existingDocuments.INCOME_PROOF
      ) {
        errors.push(
          "Income proof is required."
        );
      }
    }

    if (errors.length > 0) {
      setError(errors[0]);
      return false;
    }

    setError("");
    return true;
  };

  /*
   * =====================================================
   * NEXT STEP
   * =====================================================
   */
  const handleNext = async () => {
    if (
      !validateStep(currentStep)
    ) {
      return;
    }

    /*
     * Save steps 1-3 before moving forward.
     */
    if (currentStep <= 3) {
      const saved =
        await saveDraft(false);

      if (!saved) {
        return;
      }
    }

    setCurrentStep(
      (prev) =>
        Math.min(prev + 1, 5)
    );

    setError("");
    setSuccess("");
  };

  /*
   * =====================================================
   * BACK
   * =====================================================
   */
  const handleBack = () => {
    setCurrentStep(
      (prev) =>
        Math.max(prev - 1, 1)
    );

    setError("");
    setSuccess("");
  };

  /*
   * =====================================================
   * DOCUMENT SELECTION
   * =====================================================
   */
  const handleDocumentChange = (
    documentType,
    file
  ) => {
    setError("");
    setSuccess("");

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Only PDF, JPG and PNG files are allowed."
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Each document must be smaller than 5 MB."
      );

      return;
    }

    setDocuments((prev) => ({
      ...prev,

      [documentType]: file,
    }));
  };

  /*
   * =====================================================
   * UPLOAD ONE DOCUMENT
   * =====================================================
   */
  const uploadDocument = async (
    documentType,
    file
  ) => {
    if (
      !loanId ||
      !file
    ) {
      return false;
    }

    const formDataToUpload =
      new FormData();

    formDataToUpload.append(
      "document",
      file
    );

    formDataToUpload.append(
      "documentType",
      documentType
    );

    try {
      await api.post(
        `/loans/${loanId}/documents`,
        formDataToUpload,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      return true;

    } catch (err) {
      console.error(
        "Document upload error:",
        err
      );

      setError(
        err.response?.data?.message ||
          `Unable to upload ${
            documentType ===
            "ID_PROOF"
              ? "ID proof"
              : "income proof"
          }.`
      );

      return false;
    }
  };

  /*
   * =====================================================
   * UPLOAD DOCUMENTS
   * =====================================================
   *
   * If a new file was selected, upload it.
   *
   * If no new file was selected but an old server
   * document exists, keep the existing document.
   */
  const uploadAllDocuments =
    async () => {
      if (
        !validateStep(4)
      ) {
        return false;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        /*
         * ID proof
         */
        if (documents.ID_PROOF) {
          const idUploaded =
            await uploadDocument(
              "ID_PROOF",
              documents.ID_PROOF
            );

          if (!idUploaded) {
            return false;
          }
        }

        /*
         * Income proof
         */
        if (
          documents.INCOME_PROOF
        ) {
          const incomeUploaded =
            await uploadDocument(
              "INCOME_PROOF",
              documents.INCOME_PROOF
            );

          if (!incomeUploaded) {
            return false;
          }
        }

        /*
         * Refresh documents from backend.
         */
        const documentResponse =
          await api.get(
            `/loans/${loanId}/documents`
          );

        const serverDocuments =
          documentResponse.data
            .documents || [];

        setExistingDocuments({
          ID_PROOF:
            serverDocuments.find(
              (document) =>
                document.documentType ===
                "ID_PROOF"
            ) || null,

          INCOME_PROOF:
            serverDocuments.find(
              (document) =>
                document.documentType ===
                "INCOME_PROOF"
            ) || null,
        });

        /*
         * New browser-selected files are now
         * represented by the backend documents.
         *
         * Clear the temporary file state.
         */
        setDocuments({
          ID_PROOF: null,
          INCOME_PROOF: null,
        });

        setSuccess(
          "Documents are ready for submission."
        );

        return true;

      } catch (err) {
        console.error(
          "Upload documents error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to process your documents."
        );

        return false;

      } finally {
        setSaving(false);
      }
    };

  /*
   * =====================================================
   * STEP 4 → STEP 5
   * =====================================================
   */
  const handleDocumentsNext =
    async () => {
      const uploaded =
        await uploadAllDocuments();

      if (!uploaded) {
        return;
      }

      setCurrentStep(5);
      setError("");
    };

  /*
   * =====================================================
   * FINAL SUBMISSION
   * =====================================================
   */
  const handleSubmit =
    async () => {
      try {
        setSubmitting(true);
        setError("");
        setSuccess("");

        /*
         * Save the latest text information first.
         */
        const saved =
          await saveDraft(false);

        if (!saved) {
          return;
        }

        /*
         * Backend performs final validation,
         * including required documents.
         */
        const response =
          await api.post(
            `/loans/${loanId}/submit`
          );

        setSuccess(
          response.data.message ||
            "Your loan application has been submitted successfully."
        );

        /*
         * Go to application details after
         * showing the success message.
         */
        setTimeout(() => {
          navigate(
            `/applicant/loans/${loanId}`,
            {
              replace: true,
            }
          );
        }, 1200);

      } catch (err) {
        console.error(
          "Submit application error:",
          err
        );

        const backendMessage =
          err.response?.data?.message;

        const missingFields =
          err.response?.data
            ?.missingFields;

        if (
          missingFields?.length
        ) {
          setError(
            `${
              backendMessage ||
              "Application is incomplete"
            }: ${missingFields.join(
              ", "
            )}`
          );
        } else {
          setError(
            backendMessage ||
              "Unable to submit your application. Please try again."
          );
        }

      } finally {
        setSubmitting(false);
      }
    };

  /*
   * =====================================================
   * LOADING SCREEN
   * =====================================================
   */
  if (loading) {
    return (
      <div className="application-loading">
        <div className="application-loader"></div>

        <h3>
          Preparing your application...
        </h3>

        <p>
          Please wait while we load your secure application.
        </p>
      </div>
    );
  }

  /*
   * =====================================================
   * MAIN UI
   * =====================================================
   */
  return (
    <div className="loan-application-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="application-header">

        <div>

          <button
            className="back-dashboard-btn"
            onClick={() =>
              navigate("/applicant")
            }
          >
            ← Dashboard
          </button>

          <div className="application-heading">

            <span className="heading-icon">
              ✦
            </span>

            <div>

              <p className="eyebrow-text">
                LOAN APPLICATION
              </p>

              <h1>
                Let's build your application
              </h1>

              <p>
                Complete the steps below. Your
                progress is saved as a draft.
              </p>

            </div>

          </div>

        </div>

        <div className="secure-badge">

          <span>🔒</span>

          <div>

            <strong>
              Secure Application
            </strong>

            <small>
              Your information is protected
            </small>

          </div>

        </div>

      </div>

      {/* =================================================
          PROGRESS
          ================================================= */}

      <div className="application-progress-card">

        <div className="progress-line">

          <div
            className="progress-line-fill"
            style={{
              width: `${
                ((currentStep - 1) / 4) *
                100
              }%`,
            }}
          ></div>

        </div>

        <div className="progress-steps">

          {steps.map((step) => {

            const isActive =
              currentStep ===
              step.number;

            const isCompleted =
              currentStep >
              step.number;

            return (
              <div
                className={`progress-step ${
                  isActive
                    ? "active"
                    : ""
                } ${
                  isCompleted
                    ? "completed"
                    : ""
                }`}
                key={step.number}
              >

                <div className="step-circle">

                  {isCompleted
                    ? "✓"
                    : step.number}

                </div>

                <div className="step-info">

                  <strong>
                    {step.title}
                  </strong>

                  <span>
                    {step.subtitle}
                  </span>

                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="application-alert error-alert">

          <span className="alert-icon">
            !
          </span>

          <div>

            <strong>
              Something needs your attention
            </strong>

            <p>
              {error}
            </p>

          </div>

          <button
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>

        </div>
      )}

      {/* =================================================
          SUCCESS
          ================================================= */}

      {success && (
        <div className="application-alert success-alert">

          <span className="alert-icon">
            ✓
          </span>

          <div>

            <strong>
              Success
            </strong>

            <p>
              {success}
            </p>

          </div>

          <button
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>

        </div>
      )}

      {/* =================================================
          MAIN LAYOUT
          ================================================= */}

      <div className="application-layout">

        <main className="application-card">

          {/* =================================================
              STEP 1 — PERSONAL DETAILS
              ================================================= */}

          {currentStep === 1 && (
            <section className="application-section">

              <div className="section-heading">

                <div className="section-icon blue">
                  01
                </div>

                <div>

                  <h2>
                    Personal Information
                  </h2>

                  <p>
                    Enter your basic details exactly
                    as they appear on your official
                    documents.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                {/* Full Name */}

                <div className="form-group full-width">

                  <label>
                    Full Name{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={
                      formData
                        .personalDetails
                        .fullName
                    }
                    onChange={(e) =>
                      updateField(
                        "personalDetails",
                        "fullName",
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* Date of Birth */}

                <div className="form-group">

                  <label>
                    Date of Birth{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    value={
                      formData
                        .personalDetails
                        .dateOfBirth
                    }
                    onChange={(e) =>
                      updateField(
                        "personalDetails",
                        "dateOfBirth",
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* PAN */}

                <div className="form-group">

                  <label>
                    PAN / ID Number{" "}
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    value={
                      formData
                        .personalDetails
                        .panNumber
                    }
                    onChange={(e) =>
                      updateField(
                        "personalDetails",
                        "panNumber",
                        e.target.value.toUpperCase()
                      )
                    }
                  />

                  <small>
                    Enter the identification number
                    used for verification.
                  </small>

                </div>

                {/* Address */}

                <div className="form-group full-width">

                  <label>
                    Address{" "}
                    <span>*</span>
                  </label>

                  <textarea
                    rows="5"
                    placeholder="Enter your complete residential address"
                    value={
                      formData
                        .personalDetails
                        .address
                    }
                    onChange={(e) =>
                      updateField(
                        "personalDetails",
                        "address",
                        e.target.value
                      )
                    }
                  ></textarea>

                </div>

              </div>

            </section>
          )}

          {/* =================================================
              STEP 2 — LOAN DETAILS
              ================================================= */}

          {currentStep === 2 && (
            <section className="application-section">

              <div className="section-heading">

                <div className="section-icon cyan">
                  02
                </div>

                <div>

                  <h2>
                    Loan Details
                  </h2>

                  <p>
                    Select the loan that fits your
                    financial requirement.
                  </p>

                </div>

              </div>

              <div className="loan-type-grid">

                {loanTypes.map(
                  (loan) => (

                    <button
                      type="button"
                      key={loan.value}
                      className={`loan-type-card ${
                        formData
                          .loanDetails
                          .loanType ===
                        loan.value
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        updateField(
                          "loanDetails",
                          "loanType",
                          loan.value
                        )
                      }
                    >

                      <div className="loan-card-top">

                        <div className="loan-type-icon">

                          {loan.value ===
                            "PERSONAL" &&
                            "👤"}

                          {loan.value ===
                            "HOME" &&
                            "⌂"}

                          {loan.value ===
                            "VEHICLE" &&
                            "🚗"}

                          {loan.value ===
                            "BUSINESS" &&
                            "▣"}

                        </div>

                        <div className="rate-pill">

                          From{" "}
                          {loan.rate}%

                        </div>

                      </div>

                      <h3>
                        {loan.label}
                      </h3>

                      <p>
                        {loan.description}
                      </p>

                      <div className="selection-indicator">

                        {formData
                          .loanDetails
                          .loanType ===
                        loan.value
                          ? "✓ Selected"
                          : "Select"}

                      </div>

                    </button>

                  )
                )}

              </div>

              <div className="form-grid loan-form-grid">

                {/* Amount */}

                <div className="form-group">

                  <label>
                    Loan Amount{" "}
                    <span>*</span>
                  </label>

                  <div className="input-with-prefix">

                    <span>
                      ₹
                    </span>

                    <input
                      type="number"
                      min="1"
                      placeholder="500000"
                      value={
                        formData
                          .loanDetails
                          .amount
                      }
                      onChange={(e) =>
                        updateField(
                          "loanDetails",
                          "amount",
                          e.target.value
                        )
                      }
                    />

                  </div>

                </div>

                {/* Tenure */}

                <div className="form-group">

                  <label>
                    Tenure{" "}
                    <span>*</span>
                  </label>

                  <div className="input-with-suffix">

                    <input
                      type="number"
                      min="1"
                      placeholder="36"
                      value={
                        formData
                          .loanDetails
                          .tenure
                      }
                      onChange={(e) =>
                        updateField(
                          "loanDetails",
                          "tenure",
                          e.target.value
                        )
                      }
                    />

                    <span>
                      months
                    </span>

                  </div>

                </div>

                {/* Purpose */}

                <div className="form-group full-width">

                  <label>
                    Purpose of Loan{" "}
                    <span>*</span>
                  </label>

                  <textarea
                    rows="4"
                    placeholder="Tell us briefly how you plan to use the loan"
                    value={
                      formData
                        .loanDetails
                        .purpose
                    }
                    onChange={(e) =>
                      updateField(
                        "loanDetails",
                        "purpose",
                        e.target.value
                      )
                    }
                  ></textarea>

                </div>

              </div>

              {/* EMI */}

              {selectedLoan && (
                <div className="emi-preview">

                  <div className="emi-preview-left">

                    <div className="emi-icon">
                      ₹
                    </div>

                    <div>

                      <span>
                        Estimated Monthly EMI
                      </span>

                      <strong>
                        {formatCurrency(
                          estimatedEMI
                        )}
                      </strong>

                    </div>

                  </div>

                  <div className="emi-preview-details">

                    <div>

                      <span>
                        Interest Rate
                      </span>

                      <strong>
                        {interestRate}% p.a.
                      </strong>

                    </div>

                    <div>

                      <span>
                        Tenure
                      </span>

                      <strong>
                        {
                          formData
                            .loanDetails
                            .tenure || 0
                        }{" "}
                        months
                      </strong>

                    </div>

                    <div>

                      <span>
                        Principal
                      </span>

                      <strong>
                        {formatCurrency(
                          Number(
                            formData
                              .loanDetails
                              .amount
                          )
                        )}
                      </strong>

                    </div>

                  </div>

                </div>
              )}

            </section>
          )}

          {/* =================================================
              STEP 3 — INCOME DETAILS
              ================================================= */}

          {currentStep === 3 && (
            <section className="application-section">

              <div className="section-heading">

                <div className="section-icon green">
                  03
                </div>

                <div>

                  <h2>
                    Income Details
                  </h2>

                  <p>
                    This information helps us
                    understand your repayment
                    capacity.
                  </p>

                </div>

              </div>

              <div className="income-info-banner">

                <div className="info-symbol">
                  i
                </div>

                <div>

                  <strong>
                    Why do we need this?
                  </strong>

                  <p>
                    Your income information is used
                    during the eligibility assessment
                    of your loan application.
                  </p>

                </div>

              </div>

              <div className="form-grid">

                {/* Income */}

                <div className="form-group">

                  <label>
                    Monthly Income{" "}
                    <span>*</span>
                  </label>

                  <div className="input-with-prefix">

                    <span>
                      ₹
                    </span>

                    <input
                      type="number"
                      min="1"
                      placeholder="50000"
                      value={
                        formData
                          .incomeDetails
                          .monthlyIncome
                      }
                      onChange={(e) =>
                        updateField(
                          "incomeDetails",
                          "monthlyIncome",
                          e.target.value
                        )
                      }
                    />

                  </div>

                </div>

                {/* Employment */}

                <div className="form-group">

                  <label>
                    Employment Type{" "}
                    <span>*</span>
                  </label>

                  <select
                    value={
                      formData
                        .incomeDetails
                        .employmentType
                    }
                    onChange={(e) =>
                      updateField(
                        "incomeDetails",
                        "employmentType",
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Select employment type
                    </option>

                    <option value="SALARIED">
                      Salaried
                    </option>

                    <option value="SELF_EMPLOYED">
                      Self Employed
                    </option>

                    <option value="BUSINESS_OWNER">
                      Business Owner
                    </option>

                    <option value="PROFESSIONAL">
                      Professional
                    </option>

                    <option value="OTHER">
                      Other
                    </option>

                  </select>

                </div>

              </div>

              {formData
                .incomeDetails
                .monthlyIncome && (
                <div className="income-summary-card">

                  <div className="income-summary-icon">
                    ₹
                  </div>

                  <div>

                    <span>
                      Declared Monthly Income
                    </span>

                    <strong>
                      {formatCurrency(
                        Number(
                          formData
                            .incomeDetails
                            .monthlyIncome
                        )
                      )}
                    </strong>

                  </div>

                </div>
              )}

            </section>
          )}

          {/* =================================================
              STEP 4 — DOCUMENTS
              ================================================= */}

          {currentStep === 4 && (
            <section className="application-section">

              <div className="section-heading">

                <div className="section-icon violet">
                  04
                </div>

                <div>

                  <h2>
                    Required Documents
                  </h2>

                  <p>
                    Upload clear copies of your identity
                    and income proof.
                  </p>

                </div>

              </div>

              <div className="document-notice">

                <span>
                  ✦
                </span>

                <p>
                  Accepted formats:{" "}
                  <strong>
                    PDF, JPG, PNG
                  </strong>
                  . Maximum file size:{" "}
                  <strong>
                    5 MB
                  </strong>{" "}
                  per document.
                </p>

              </div>

              <div className="document-upload-grid">

                {/* =================================================
                    ID PROOF
                    ================================================= */}

                <div className="document-upload-card">

                  <div className="document-card-header">

                    <div className="document-icon blue">
                      ID
                    </div>

                    <div>

                      <h3>
                        Identity Proof
                      </h3>

                      <p>
                        Required
                      </p>

                    </div>

                    {(documents.ID_PROOF ||
                      existingDocuments.ID_PROOF) && (
                      <span className="document-check">
                        ✓
                      </span>
                    )}

                  </div>

                  <label className="upload-area">

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleDocumentChange(
                          "ID_PROOF",
                          e.target.files[0]
                        )
                      }
                    />

                    {documents.ID_PROOF ||
                    existingDocuments.ID_PROOF ? (
                      <>

                        <div className="upload-success-icon">
                          ✓
                        </div>

                        <strong>
                          {documents.ID_PROOF?.name ||
                            existingDocuments
                              .ID_PROOF
                              ?.originalName}
                        </strong>

                        {documents.ID_PROOF ? (
                          <span>
                            {(
                              documents
                                .ID_PROOF
                                .size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </span>
                        ) : (
                          <span>
                            Previously uploaded
                          </span>
                        )}

                        <small>
                          Click to replace
                        </small>

                      </>
                    ) : (
                      <>

                        <div className="upload-icon">
                          ↑
                        </div>

                        <strong>
                          Choose ID proof
                        </strong>

                        <span>
                          PDF, JPG or PNG
                        </span>

                      </>
                    )}

                  </label>

                </div>

                {/* =================================================
                    INCOME PROOF
                    ================================================= */}

                <div className="document-upload-card">

                  <div className="document-card-header">

                    <div className="document-icon green">
                      ₹
                    </div>

                    <div>

                      <h3>
                        Income Proof
                      </h3>

                      <p>
                        Required
                      </p>

                    </div>

                    {(documents.INCOME_PROOF ||
                      existingDocuments.INCOME_PROOF) && (
                      <span className="document-check">
                        ✓
                      </span>
                    )}

                  </div>

                  <label className="upload-area">

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        handleDocumentChange(
                          "INCOME_PROOF",
                          e.target.files[0]
                        )
                      }
                    />

                    {documents.INCOME_PROOF ||
                    existingDocuments.INCOME_PROOF ? (
                      <>

                        <div className="upload-success-icon">
                          ✓
                        </div>

                        <strong>
                          {documents
                            .INCOME_PROOF
                            ?.name ||
                            existingDocuments
                              .INCOME_PROOF
                              ?.originalName}
                        </strong>

                        {documents.INCOME_PROOF ? (
                          <span>
                            {(
                              documents
                                .INCOME_PROOF
                                .size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </span>
                        ) : (
                          <span>
                            Previously uploaded
                          </span>
                        )}

                        <small>
                          Click to replace
                        </small>

                      </>
                    ) : (
                      <>

                        <div className="upload-icon">
                          ↑
                        </div>

                        <strong>
                          Choose income proof
                        </strong>

                        <span>
                          PDF, JPG or PNG
                        </span>

                      </>
                    )}

                  </label>

                </div>

              </div>

              <div className="document-security-note">

                <span>
                  🔐
                </span>

                <div>

                  <strong>
                    Your documents are secure
                  </strong>

                  <p>
                    Documents are stored securely and
                    are accessible only to authorized users
                    involved in reviewing your application.
                  </p>

                </div>

              </div>

            </section>
          )}

          {/* =================================================
              STEP 5 — REVIEW
              ================================================= */}

          {currentStep === 5 && (
            <section className="application-section">

              <div className="section-heading">

                <div className="section-icon cyan">
                  05
                </div>

                <div>

                  <h2>
                    Review Your Application
                  </h2>

                  <p>
                    Please verify your information
                    before submitting.
                  </p>

                </div>

              </div>

              {/* =================================================
                  PERSONAL SUMMARY
                  ================================================= */}

              <div className="review-card">

                <div className="review-card-header">

                  <div>

                    <span className="review-number">
                      01
                    </span>

                    <h3>
                      Personal Details
                    </h3>

                  </div>

                  <button
                    onClick={() =>
                      setCurrentStep(1)
                    }
                  >
                    Edit
                  </button>

                </div>

                <div className="review-grid">

                  <div>

                    <span>
                      Full Name
                    </span>

                    <strong>
                      {formData
                        .personalDetails
                        .fullName ||
                        "—"}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Date of Birth
                    </span>

                    <strong>
                      {formData
                        .personalDetails
                        .dateOfBirth ||
                        "—"}
                    </strong>

                  </div>

                  <div>

                    <span>
                      PAN / ID
                    </span>

                    <strong>
                      {formData
                        .personalDetails
                        .panNumber ||
                        "—"}
                    </strong>

                  </div>

                  <div className="review-full">

                    <span>
                      Address
                    </span>

                    <strong>
                      {formData
                        .personalDetails
                        .address ||
                        "—"}
                    </strong>

                  </div>

                </div>

              </div>

              {/* =================================================
                  LOAN SUMMARY
                  ================================================= */}

              <div className="review-card">

                <div className="review-card-header">

                  <div>

                    <span className="review-number">
                      02
                    </span>

                    <h3>
                      Loan Details
                    </h3>

                  </div>

                  <button
                    onClick={() =>
                      setCurrentStep(2)
                    }
                  >
                    Edit
                  </button>

                </div>

                <div className="review-grid">

                  <div>

                    <span>
                      Loan Type
                    </span>

                    <strong>
                      {selectedLoan?.label ||
                        "—"}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Interest Rate
                    </span>

                    <strong>
                      {interestRate ||
                        "—"}% p.a.
                    </strong>

                  </div>

                  <div>

                    <span>
                      Loan Amount
                    </span>

                    <strong>
                      {formatCurrency(
                        Number(
                          formData
                            .loanDetails
                            .amount
                        )
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Tenure
                    </span>

                    <strong>
                      {formData
                        .loanDetails
                        .tenure
                        ? `${formData.loanDetails.tenure} months`
                        : "—"}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Estimated EMI
                    </span>

                    <strong className="review-highlight">
                      {formatCurrency(
                        estimatedEMI
                      )}
                    </strong>

                  </div>

                  <div className="review-full">

                    <span>
                      Purpose
                    </span>

                    <strong>
                      {formData
                        .loanDetails
                        .purpose ||
                        "—"}
                    </strong>

                  </div>

                </div>

              </div>

              {/* =================================================
                  INCOME SUMMARY
                  ================================================= */}

              <div className="review-card">

                <div className="review-card-header">

                  <div>

                    <span className="review-number">
                      03
                    </span>

                    <h3>
                      Income Details
                    </h3>

                  </div>

                  <button
                    onClick={() =>
                      setCurrentStep(3)
                    }
                  >
                    Edit
                  </button>

                </div>

                <div className="review-grid">

                  <div>

                    <span>
                      Monthly Income
                    </span>

                    <strong>
                      {formatCurrency(
                        Number(
                          formData
                            .incomeDetails
                            .monthlyIncome
                        )
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Employment Type
                    </span>

                    <strong>
                      {formatEmploymentTypeForDisplay(
                        formData
                          .incomeDetails
                          .employmentType
                      ) || "—"}
                    </strong>

                  </div>

                </div>

              </div>

              {/* =================================================
                  DOCUMENT SUMMARY
                  ================================================= */}

              <div className="review-card">

                <div className="review-card-header">

                  <div>

                    <span className="review-number">
                      04
                    </span>

                    <h3>
                      Documents
                    </h3>

                  </div>

                  <button
                    onClick={() =>
                      setCurrentStep(4)
                    }
                  >
                    Edit
                  </button>

                </div>

                <div className="review-documents">

                  {/* ID */}

                  <div className="review-document">

                    <div className="review-document-icon">
                      ID
                    </div>

                    <div>

                      <strong>
                        {documents.ID_PROOF?.name ||
                          existingDocuments
                            .ID_PROOF
                            ?.originalName ||
                          "ID proof selected"}
                      </strong>

                      <span>
                        Identity Proof
                      </span>

                    </div>

                    <span className="verified-pill">
                      ✓ Ready
                    </span>

                  </div>

                  {/* Income */}

                  <div className="review-document">

                    <div className="review-document-icon green">
                      ₹
                    </div>

                    <div>

                      <strong>
                        {documents
                          .INCOME_PROOF
                          ?.name ||
                          existingDocuments
                            .INCOME_PROOF
                            ?.originalName ||
                          "Income proof selected"}
                      </strong>

                      <span>
                        Income Proof
                      </span>

                    </div>

                    <span className="verified-pill">
                      ✓ Ready
                    </span>

                  </div>

                </div>

              </div>

              {/* =================================================
                  FINAL CONFIRMATION
                  ================================================= */}

              <div className="final-confirmation">

                <div className="confirmation-icon">
                  ✓
                </div>

                <div>

                  <h3>
                    Ready to submit?
                  </h3>

                  <p>
                    By submitting this application,
                    you confirm that the information
                    provided is accurate and complete.
                    Our loan officer will review your
                    application after submission.
                  </p>

                </div>

              </div>

            </section>
          )}

          {/* =================================================
              BOTTOM ACTIONS
              ================================================= */}

          <div className="application-actions">

            <div>

              {currentStep > 1 && (
                <button
                  className="secondary-action"
                  onClick={handleBack}
                  disabled={
                    saving ||
                    submitting
                  }
                >
                  ← Back
                </button>
              )}

              {currentStep <= 3 && (
                <button
                  className="save-action"
                  onClick={() =>
                    saveDraft(true)
                  }
                  disabled={
                    saving ||
                    submitting
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </button>
              )}

            </div>

            <div>

              {currentStep < 3 && (
                <button
                  className="primary-action"
                  onClick={handleNext}
                  disabled={
                    saving ||
                    submitting
                  }
                >
                  Continue
                  <span>
                    →
                  </span>
                </button>
              )}

              {currentStep === 3 && (
                <button
                  className="primary-action"
                  onClick={handleNext}
                  disabled={
                    saving ||
                    submitting
                  }
                >
                  Continue to Documents
                  <span>
                    →
                  </span>
                </button>
              )}

              {currentStep === 4 && (
                <button
                  className="primary-action"
                  onClick={
                    handleDocumentsNext
                  }
                  disabled={
                    saving ||
                    submitting
                  }
                >
                  Review Application
                  <span>
                    →
                  </span>
                </button>
              )}

              {currentStep === 5 && (
                <button
                  className="submit-action"
                  onClick={
                    handleSubmit
                  }
                  disabled={
                    submitting ||
                    saving
                  }
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Application"}

                  <span>
                    ✓
                  </span>
                </button>
              )}

            </div>

          </div>

        </main>

        {/* =================================================
            RIGHT SIDEBAR
            ================================================= */}

        <aside className="application-sidebar">

          {/* Guide */}

          <div className="sidebar-card">

            <div className="sidebar-card-heading">

              <span className="sidebar-heading-icon">
                ✦
              </span>

              <div>

                <h3>
                  Application Guide
                </h3>

                <p>
                  Almost there!
                </p>

              </div>

            </div>

            <div className="guide-progress">

              <div>

                <span>
                  Progress
                </span>

                <strong>
                  {currentStep} / 5
                </strong>

              </div>

              <div className="guide-progress-bar">

                <div
                  style={{
                    width: `${
                      (currentStep / 5) *
                      100
                    }%`,
                  }}
                ></div>

              </div>

            </div>

            <div className="guide-list">

              <div
                className={
                  currentStep >= 1
                    ? "done"
                    : ""
                }
              >

                <span>
                  {currentStep > 1
                    ? "✓"
                    : "1"}
                </span>

                <p>
                  Personal details
                </p>

              </div>

              <div
                className={
                  currentStep >= 2
                    ? "done"
                    : ""
                }
              >

                <span>
                  {currentStep > 2
                    ? "✓"
                    : "2"}
                </span>

                <p>
                  Loan details
                </p>

              </div>

              <div
                className={
                  currentStep >= 3
                    ? "done"
                    : ""
                }
              >

                <span>
                  {currentStep > 3
                    ? "✓"
                    : "3"}
                </span>

                <p>
                  Income details
                </p>

              </div>

              <div
                className={
                  currentStep >= 4
                    ? "done"
                    : ""
                }
              >

                <span>
                  {currentStep > 4
                    ? "✓"
                    : "4"}
                </span>

                <p>
                  Required documents
                </p>

              </div>

              <div
                className={
                  currentStep >= 5
                    ? "done"
                    : ""
                }
              >

                <span>
                  {currentStep > 5
                    ? "✓"
                    : "5"}
                </span>

                <p>
                  Review & submit
                </p>

              </div>

            </div>

          </div>

          {/* Selected loan */}

          {selectedLoan && (
            <div className="sidebar-card loan-summary-sidebar">

              <div className="sidebar-mini-label">
                SELECTED LOAN
              </div>

              <h3>
                {selectedLoan.label}
              </h3>

              <div className="sidebar-loan-row">

                <span>
                  Amount
                </span>

                <strong>
                  {formatCurrency(
                    Number(
                      formData
                        .loanDetails
                        .amount
                    )
                  )}
                </strong>

              </div>

              <div className="sidebar-loan-row">

                <span>
                  Interest
                </span>

                <strong>
                  {interestRate}%
                </strong>

              </div>

              <div className="sidebar-loan-row">

                <span>
                  Tenure
                </span>

                <strong>
                  {formData
                    .loanDetails
                    .tenure || 0}{" "}
                  mo.
                </strong>

              </div>

              <div className="sidebar-emi">

                <span>
                  Estimated EMI
                </span>

                <strong>
                  {formatCurrency(
                    estimatedEMI
                  )}
                </strong>

              </div>

            </div>
          )}

          {/* Support */}

          <div className="sidebar-card support-card">

            <div className="support-icon">
              ?
            </div>

            <div>

              <h3>
                Need help?
              </h3>

              <p>
                Make sure your information
                matches your official documents.
              </p>

            </div>

          </div>

        </aside>

      </div>

    </div>
  );
};

export default LoanApplication;