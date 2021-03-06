import React, { useEffect, useState } from "react";
import { Paper, makeStyles, Theme } from "@material-ui/core";
import { fetchTopics, addNewPost } from "../../actions/posts";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../reducers";
import { IPostFormData, IIndexable } from "../../helpers/types";
import { Redirect } from "react-router-dom";
import { Formik, FormikHelpers } from "formik";
import PostForm from "./PostForm";

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: "80%",
    margin: theme.spacing(1),
  },
  button: {
    margin: theme.spacing(1),
  },
}));

const validate = (values: IPostFormData) => {
  const errors: IErrors = {};
  const requiredFields: string[] = ["title", "body", "topic"];

  requiredFields.forEach((field) => {
    if (!values[field]) {
      errors[field] = "Required";
    }
  });

  if (values.topic === "other" && !values["otherTopic"]) {
    errors["otherTopic"] = "You must specify other topic";
  }

  return errors;
};

type IErrors = IIndexable & {
  title?: string;
  topic?: string;
  otherTopic?: string;
  body?: string;
};

export default function AddPost() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth.user);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchTopics());
  }, []);

  const initialValues: IPostFormData = {
    title: "",
    topic: "",
    otherTopic: "",
    body: "",
  };

  if (!user.userId) {
    return <Redirect to="/posts" />;
  }

  if (success) {
    return <Redirect to="/posts" />;
  }

  return (
    <Paper className={classes.paper}>
      <Formik
        initialValues={initialValues}
        onSubmit={(
          values: IPostFormData,
          { setSubmitting }: FormikHelpers<IPostFormData>
        ) => {
          dispatch(addNewPost(values));
          setSubmitting(false);
          setSuccess(true);
        }}
        validate={validate}
      >
        {({ isSubmitting }) => <PostForm isSubmitting={isSubmitting} />}
      </Formik>
    </Paper>
  );
}
