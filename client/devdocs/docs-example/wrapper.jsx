/** @format */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Gridicon from 'gridicons';
import DocsExampleError from 'devdocs/docs-example/error';

const renderTitle = ( unique, name, url ) =>
	unique ? (
		<span className="docs-example__wrapper-header-title">{ name }</span>
	) : (
		<a className="docs-example__wrapper-header-title" href={ url }>
			{ name }
			<Gridicon icon="link" />
		</a>
	);

class DocsExampleWrapper extends Component {
	static propTypes = {
		name: PropTypes.string.isRequired,
		unique: PropTypes.bool,
		url: PropTypes.string.isRequired,
	};

	state = {
		hasError: false,
	};

	componentDidCatch() {
		this.setState( { hasError: true } );
	}

	render() {
		const { children, name, unique, url } = this.props;

		return (
			<div
				className={ classNames( 'docs-example__wrapper', {
					'docs-example__wrapper-unique': unique,
				} ) }
			>
				<h2 className="docs-example__wrapper-header">{ renderTitle( unique, name, url ) }</h2>
				{ this.state.hasError ? <DocsExampleError /> : children }
			</div>
		);
	}
}

export default DocsExampleWrapper;
