import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const Login = () => {
  const { login, signup, loginDemo, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const validationSchema = Yup.object().shape({
    name: isSignUp ? Yup.string().required('Full name is required') : Yup.string(),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().required('Password is required').min(6, 'Must be at least 6 characters'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    setServerError('');
    try {
      if (isSignUp) {
        await signup(values.name, values.email, values.password);
      } else {
        await login(values.email, values.password);
      }
    } catch (error) {
      setServerError(error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient"
         style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-lg border-0 rounded-3">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h1 className="h3 fw-bold text-primary mb-2">
                    <i className="bi bi-wallet2 me-2"></i> Budget Wise
                  </h1>
                  <p className="text-muted">Your Personal Finance Companion</p>
                </div>

                {serverError && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {serverError}
                  </div>
                )}

                <Formik
                  initialValues={{ name: '', email: '', password: '' }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting }) => (
                    <Form>
                      {isSignUp && (
                        <div className="mb-3">
                          <label className="form-label">Username</label>
                          <Field
                            name="name"
                            type="text"
                            className="form-control"
                            placeholder="Enter your username"
                          />
                          <ErrorMessage name="name" component="div" className="text-danger" />
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <Field
                          name="email"
                          type="email"
                          className="form-control "
                          placeholder="Enter your email"
                        />
                        <ErrorMessage name="email" component="div" className="text-danger" />
                      </div>

                      <div className="mb-4">
                        <label className="form-label">Password</label>
                        <div className="input-group">
                          <Field
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            className="form-control "
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>
                        </div>
                        <ErrorMessage name="password" component="div" className="text-danger" />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary  w-100 mb-3"
                        disabled={isSubmitting || loading}
                      >
                        {loading || isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            {isSignUp ? 'Signing Up...' : 'Logging In...'}
                          </>
                        ) : (
                          isSignUp ? 'Sign Up' : 'Log In'
                        )}
                      </button>
                    </Form>
                  )}
                </Formik>

                <div className="text-center">
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                  </button>

                  <hr className="my-3" />

                  <button
                    type="button"
                    className="btn btn-success w-100"
                    onClick={loginDemo}
                  >
                    <i className="bi bi-rocket me-2"></i>
                    Try Demo (Skip Login)
                  </button>

                  <small className="text-muted d-block mt-2">
                    Click here to skip login and explore the app
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
