import {
  Box,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  LinearProgressProps,
  List,
  ListItem,
  makeStyles,
  Menu,
  MenuItem,
  Theme,
  Typography,
} from "@material-ui/core";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchProgressBars, setCurrentGoal } from "../../actions/goals";
import { PROGRESS_BARS_URL } from "../../constants/urls";
import { IProgressBar } from "../../helpers/types";
import AddSubgoal from "./AddSubgoal";
import CheckBox from "./CheckBox";
import DayCounter from "./DayCounter";
import EditGoal from "./EditGoal";
import differenceInDays from "date-fns/differenceInDays";
import parseISO from "date-fns/parseISO";
import { AppState } from "../../reducers";

const useStyles = makeStyles((theme: Theme) => ({
  nested: {
    paddingLeft: theme.spacing(2),
  },
  menu: {
    boxShadow: "none",
  },
}));

interface IProps {
  progressBar: IProgressBar;
  parentGoalId: string | null;
  updateProgress: boolean;
}

export default function ProgressBar(props: IProps) {
  const { progressBar, parentGoalId, updateProgress } = props;

  const classes = useStyles();

  const [progress, setProgress] = useState<number>(
    calculateProgress(progressBar)
  );

  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const dispatch = useDispatch();

  useEffect(() => {
    setProgress(calculateProgress(progressBar));
  }, [updateProgress]);

  function handleOpen(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (!anchorEl) {
      setOpen(!open);
    }
  }

  async function handleEdit(progressBar: IProgressBar) {
    async function loadGoal() {
      return dispatch(setCurrentGoal(progressBar));
    }
    await loadGoal();
    setFormOpen(true);
    handleClose();
  }

  async function handleDelete(progressBar: IProgressBar) {
    const response = await fetch(PROGRESS_BARS_URL + "/" + progressBar.goalId, {
      method: "DELETE",
    });
    if (response.ok) {
      dispatch(fetchProgressBars());
    }
    handleClose();
  }

  function calculateProgress(progressBar: IProgressBar): number {
    let childCount =
      (progressBar.childBars ? progressBar.childBars.length : 0) +
      (progressBar.subGoals ? progressBar.subGoals.length : 0) +
      (progressBar.dayCounters ? progressBar.dayCounters.length : 0);
    let completedChildCount =
      (progressBar.childBars && progressBar.childBars.length > 0
        ? progressBar.childBars
            .map((childBar) => calculateProgress(childBar) / 100)
            .reduce((sum, prog) => sum + prog)
        : 0) +
      (progressBar.subGoals && progressBar.subGoals.length > 0
        ? progressBar.subGoals
            .map((checkbox): number => (checkbox.checked ? 1 : 0))
            .reduce((sum, prog) => sum + prog)
        : 0) +
      (progressBar.dayCounters && progressBar.dayCounters.length > 0
        ? progressBar.dayCounters
            .map((dayCounter): number =>
              differenceInDays(Date.now(), parseISO(dayCounter.startingDate)) -
                dayCounter.dayGoal >=
              0
                ? 1
                : 0
            )
            .reduce((sum, prog) => sum + prog)
        : 0);
    if (childCount === 0) {
      return 100;
    }
    return Math.round((100 / childCount) * completedChildCount);
  }

  if (
    progressBar.parentGoalId !== null &&
    parentGoalId !== progressBar.parentGoalId
  ) {
    return <React.Fragment></React.Fragment>;
  }

  return (
    <React.Fragment>
      <ListItem button onClick={handleClick}>
        <Typography variant="h6">{progressBar.text}</Typography>
        <LinearProgressWithLabel value={progress} />
        <IconButton aria-label="settings" onClick={handleOpen}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
          className={classes.menu}
        >
          <MenuItem onClick={() => handleEdit(progressBar)}>Edit</MenuItem>
          <MenuItem onClick={() => handleDelete(progressBar)}>Delete</MenuItem>
        </Menu>
        <EditGoal formOpen={formOpen} setFormOpen={setFormOpen} />
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List className={classes.nested}>
          {progressBar.dayCounters
            ? progressBar.dayCounters.map((dayCounter) => (
                <React.Fragment key={dayCounter.goalId}>
                  <DayCounter
                    dayCounter={dayCounter}
                    parentGoalId={progressBar.goalId}
                  />
                  <Divider />
                </React.Fragment>
              ))
            : ""}
          {progressBar.subGoals
            ? progressBar.subGoals.map((subGoal) => (
                <React.Fragment key={subGoal.goalId}>
                  <CheckBox
                    checkbox={subGoal}
                    parentGoalId={progressBar.goalId}
                  />
                  <Divider />
                </React.Fragment>
              ))
            : ""}
          {progressBar.childBars
            ? progressBar.childBars.map((childBar) => (
                <React.Fragment key={childBar.goalId}>
                  <ProgressBar
                    progressBar={childBar}
                    parentGoalId={progressBar.goalId}
                    updateProgress={updateProgress}
                  />
                  <Divider />
                </React.Fragment>
              ))
            : ""}
          <AddSubgoal parentGoal={progressBar} />
        </List>
      </Collapse>
    </React.Fragment>
  );
}

function LinearProgressWithLabel(
  props: LinearProgressProps & { value: number }
) {
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(
          props.value
        )}%`}</Typography>
      </Box>
    </Box>
  );
}
