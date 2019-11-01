import React, { HTMLAttributes } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { getTheme } from '../../store/selectors';

import { StoreState } from '../../util/types';
import { CardBase } from '../common/card_base';
import { DropdownTextItem } from '../common/dropdown_text_item';
import {ThemeSelectionStatusContainer} from "./theme_selection_status"
import { selectTheme } from '../../store/ui/actions';
interface OwnProps extends HTMLAttributes<HTMLSpanElement> {}

interface StateProps {
    theme: string | null;
}



interface DispatchProps {
    onThemeSelected: (theme: string) => any;
   
}

type Props = StateProps & OwnProps & DispatchProps;
const DropdownItems = styled(CardBase)`
    box-shadow: ${props => props.theme.componentsTheme.boxShadow};
    min-width: 240px;
`;

class ThemeSelectionContent extends React.PureComponent<Props> {
    public render = () => {
        const { theme, ...restProps } = this.props;
        const themeText = theme ? theme : 'Select Theme';

        const content = (
            <DropdownItems>
                <DropdownTextItem onClick={this.handleDarkClick} text="Dark Theme" />
                <DropdownTextItem onClick={this.handleLightClick} text="Light Theme" />
            </DropdownItems>
        );

        return (
            <ThemeSelectionStatusContainer
            themeSelectionContent={content}
                headerText={themeText}
                theme={theme}
                {...restProps}
            />
        );
    };

     handleDarkClick: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        this.props.onThemeSelected('DARK_THEME')
    };
    handleLightClick: React.EventHandler<React.MouseEvent> = e => {
        e.preventDefault();
        this.props.onThemeSelected('LIGHT_THEME')
    };
}


const mapStateToProps = (state: StoreState): StateProps => {
    return {
        theme: getTheme(state),
    };
};

const mapDispatchToProps = (dispatch: any): DispatchProps => {
    return {
        onThemeSelected: (theme: string) => dispatch(selectTheme(theme)),
       
    };
};
const ThemeSelectionContentContainer = connect(
    mapStateToProps,
    mapDispatchToProps,
)(ThemeSelectionContent);

export { ThemeSelectionContent, ThemeSelectionContentContainer };
